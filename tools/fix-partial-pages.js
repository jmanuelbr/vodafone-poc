#!/usr/bin/env node
/**
 * Fixes partially-structured PDP pages that have some blocks
 * but are missing critical ones or have broken block content.
 *
 * Strategy: Extract useful content from existing blocks and flat HTML,
 * then rebuild the page with the same structure as the reference OPPO page.
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = '/workspace/content/c/tienda-online/autonomos/catalogo-moviles';

// Icon tokens for the benefits bar
const BENEFIT_ICONS = {
  'Pago a plazos sin intereses': ':price-promise:',
  'Trae tu móvil y ahorra': ':trade-in:',
  'Ver todos los beneficios': ':benefits:',
};

const STEP_ICONS = [':shopping-trolley:', ':bundles:', ':mail:', ':delivery:'];
const STEP_CONTENT = [
  { title: 'Realiza tu pedido' },
  { title: 'Recibirás tu SIM en 2-4 días', extra: 'y activaremos tu línea lo antes posible' },
  { title: 'Accede a tu app', extra: 'Accede a tu espacio personal en la app. Tu dispositivo estará esperando' },
  { title: 'Confirma la compra', extra: 'y recíbelo' },
];

function wrapInPicture(src, alt, loading = 'lazy') {
  return `<picture><source srcset="${src}"><source srcset="${src}" media="(min-width: 600px)"><img src="${src}" alt="${alt}" loading="${loading}"></picture>`;
}

function createBlock(blockName, rows) {
  let html = `<div class="${blockName}">`;
  for (const row of rows) {
    html += '<div>';
    for (const cell of row) {
      html += `<div>${cell}</div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function processPage(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false, xmlMode: false });

  const main = $('main');
  if (!main.length) return { success: false, reason: 'No main found' };

  // Use the first div for content extraction, but check ALL of main for block detection
  const mainDiv = main.children('div').first();
  if (!mainDiv.length) return { success: false, reason: 'No main > div found' };

  if (filePath.includes('oppo-reno-14-fs-5g-verde-512gb-316150')) {
    return { success: false, reason: 'Skipping reference page' };
  }

  // Check if this page was already fully structured (search across ALL main content)
  const hasCardsPricing = main.find('.cards-pricing').length > 0;
  const hasBreadcrumb = main.find('.breadcrumb').length > 0;
  const hasColumnsSteps = main.find('.columns.steps').length > 0;

  if (hasCardsPricing && hasBreadcrumb && hasColumnsSteps) {
    return { success: false, reason: 'Page already fully structured' };
  }

  // Only process pages that have some existing blocks but are missing critical ones
  // Search across ALL main content, not just first div
  const existingBlockCount = main.find('.product-gallery, .customer-tabs, .tariff-filter, .payment-options, .accordion').length;
  if (existingBlockCount < 2) {
    return { success: false, reason: 'Not a partially-structured page' };
  }

  // === EXTRACTION PHASE ===

  // 1. Extract gallery images from product-gallery block
  const galleryImages = [];
  const productGallery = main.find('.product-gallery').first();
  if (productGallery.length) {
    const seenSrcs = new Set();
    productGallery.find('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      if (src && !src.startsWith('blob:') && !seenSrcs.has(src)) {
        seenSrcs.add(src);
        galleryImages.push({ src, alt: $(img).attr('alt') || '' });
      }
    });
  }

  // 2. Extract payment data from payment-options block
  let paymentAPlazosText = '';
  let paymentAlContadoText = '';
  const paymentBlock = main.find('.payment-options').first();
  if (paymentBlock.length) {
    const fullText = paymentBlock.text();
    // Try to extract "A plazos" data
    const plazosMatch = fullText.match(/(\d+)€\/mes\s*\+(\d+)€\s*pago inicial/);
    if (plazosMatch) {
      paymentAPlazosText = `<strong>${plazosMatch[1]} €/mes</strong><br>+${plazosMatch[2]}€ pago inicial<br>+3,25€ canon digital`;
    }
    // Try to extract "Al contado" data
    const contadoMatch = fullText.match(/(\d+(?:,\d+)?€)\s*(?:\+3,25)?/);
    if (contadoMatch) {
      // Find the standalone price (usually the "Al contado" price)
      const allPrices = fullText.match(/\d+(?:,\d+)?€/g);
      if (allPrices && allPrices.length >= 2) {
        // The "al contado" price is usually in a separate div/paragraph
        const contadoDiv = paymentBlock.find('div > div:last-child p strong').first();
        if (contadoDiv.length) {
          paymentAlContadoText = `<strong>${contadoDiv.text().trim()}</strong><br>+3,25€ canon digital`;
        }
      }
    }
  }

  // 3. Extract accordion data
  const accordionItems = [];
  const accordionBlock = main.find('.accordion').first();
  if (accordionBlock.length) {
    accordionBlock.children('div').each((_, row) => {
      const cols = $(row).children('div');
      if (cols.length >= 2) {
        const label = $(cols[0]).text().trim();
        const body = $(cols[1]).html() || '';
        // Skip template strings and UI elements
        if (label && !label.includes('{{') && label !== 'Close' && body.trim()) {
          accordionItems.push([label, body]);
        }
      }
    });
  }

  // 4. Extract columns (transparency) content
  let transparencyText = '';
  let transparencyImageSrc = '';
  const columnsBlock = main.find('.columns').not('.steps').first();
  if (columnsBlock.length) {
    const firstCol = columnsBlock.find('div > div > div').first();
    const secondCol = columnsBlock.find('div > div > div').last();
    if (firstCol.length) {
      // Get text content, skip the heading
      firstCol.find('p').each((_, p) => {
        const pText = $(p).text().trim();
        if (pText && !pText.includes('transparentes') && pText.length > 20) {
          transparencyText = $(p).html();
        }
      });
    }
    const img = secondCol.find('img').first();
    if (img.length) {
      transparencyImageSrc = img.attr('src') || '';
    }
  }

  // 5. Extract promo card data
  const promoItems = [];
  const promoBlock = main.find('.promo-card').first();
  if (promoBlock.length) {
    promoBlock.children('div').each((_, row) => {
      const cols = $(row).children('div');
      if (cols.length >= 2) {
        const imgEl = $(cols[0]).find('img').first();
        const content = $(cols[1]).html() || '';
        if (imgEl.length && imgEl.attr('src') && !imgEl.attr('src').startsWith('blob:')) {
          promoItems.push({
            image: { src: imgEl.attr('src'), alt: imgEl.attr('alt') || '' },
            content: content.trim(),
          });
        }
      }
    });
  }

  // 6. Extract flat content: breadcrumb, benefits, title, price
  let breadcrumbHtml = '';
  let benefitsItems = [];
  let productTitleHtml = '';
  let priceSummaryHtml = '';
  let metadataHtml = '';

  // Breadcrumb: look for first ul with vodafone links
  main.find('ul').each((_, ul) => {
    const $ul = $(ul);
    if (!breadcrumbHtml && $ul.find('a[href*="vodafone.es"]').length >= 2) {
      breadcrumbHtml = $.html(ul);
    }
  });

  // Benefits: look for ul with "Pago a plazos" content
  main.find('ul').each((_, ul) => {
    const $ul = $(ul);
    if (benefitsItems.length === 0 && $ul.text().includes('Pago a plazos')) {
      $ul.find('li').each((_, li) => {
        benefitsItems.push($(li).text().trim());
      });
    }
  });

  // Product title: first h1
  const h1 = main.find('h1').first();
  if (h1.length) {
    productTitleHtml = $.html(h1);
  }

  // Price summary: first p with "desde" and "€"
  main.find('p').each((_, p) => {
    const $p = $(p);
    const t = $p.text().trim();
    if (!priceSummaryHtml && (t.includes('desde') || t.match(/\d+.*€.*\/mes/))) {
      priceSummaryHtml = $.html(p);
    }
  });

  // Metadata: always present
  const metaBlock = main.find('.metadata').first();
  if (metaBlock.length) {
    metadataHtml = $.html(metaBlock);
  }

  // === RECONSTRUCTION PHASE ===
  let newMainHtml = '';

  // Section 1: Breadcrumb
  if (breadcrumbHtml) {
    newMainHtml += `<div>${createBlock('breadcrumb', [[breadcrumbHtml]])}</div>\n`;
  }

  // Section 2: Main content
  newMainHtml += '<div>';

  // Benefits bar with icons
  if (benefitsItems.length > 0) {
    let benefitsHtml = '<ul>\n';
    benefitsItems.forEach(item => {
      const icon = BENEFIT_ICONS[item] || '';
      benefitsHtml += `<li>${icon ? icon + ' ' : ''}${item}</li>\n`;
    });
    benefitsHtml += '</ul>';
    newMainHtml += benefitsHtml;
  }

  // Product title
  if (productTitleHtml) newMainHtml += productTitleHtml;

  // Price summary
  if (priceSummaryHtml) newMainHtml += priceSummaryHtml;
  newMainHtml += '<p>Precios sin IVA</p>';

  // Product gallery
  if (galleryImages.length > 0) {
    const galleryRows = galleryImages.map(img => [wrapInPicture(img.src, img.alt)]);
    newMainHtml += createBlock('product-gallery', galleryRows);
  }

  // Tariff heading
  newMainHtml += '<h2 id="con-qué-tarifa-quieres-comprar-tu-smartphone">¿Con qué tarifa quieres comprar tu Smartphone?</h2>';

  // Customer tabs
  newMainHtml += createBlock('customer-tabs', [
    ['No soy cliente', 'active'],
    ['Ya soy cliente', '¿Eres cliente? Accede a la app y disfruta de precios exclusivos <a href="https://www.vodafone.es/c/empresas/autonomos/es/mi-vodafone/">Ir a la App Mi Vodafone</a>'],
  ]);

  // Tariff filter
  newMainHtml += createBlock('tariff-filter', [
    ['Tarifas Móvil', 'active'],
    ['Tarifas Fibra y Móvil', ''],
  ]);

  // Cards pricing - use placeholder cards since the original data was lost
  const defaultMovilCards = [
    '<p>Móvil 30GB</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
    '<p>Móvil Ilimitado (60GB a 5G)</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
    '<p>Móvil Ilimitado (160GB a 5G)</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
    '<p>Móvil Ilimitada</p><p><strong>26 €</strong>/mes</p><p>La tarifa incluye:</p>',
  ];
  const defaultFibraCards = [
    '<p>Fibra 600Mb y línea móvil 60GB</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
    '<p>Fibra 600Mb y línea móvil ilimitada (160GB a 5G)</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
    '<p>Fibra 600Mb y línea móvil ilimitada</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
    '<p>Fibra 600Mb, línea móvil ilimitada y Vodafone TV</p><p><strong>€</strong>/mes</p><p>La tarifa incluye:</p>',
  ];
  newMainHtml += createBlock('cards-pricing movil', defaultMovilCards.map(c => ['', c]));
  newMainHtml += createBlock('cards-pricing fibra', defaultFibraCards.map(c => ['', c]));

  // Payment heading
  newMainHtml += '<h2 id="cómo-quieres-pagar">¿Cómo quieres pagar?</h2>';

  // Payment options
  if (paymentAPlazosText || paymentAlContadoText) {
    const paymentRows = [];
    if (paymentAPlazosText) paymentRows.push(['A plazos', paymentAPlazosText, '']);
    if (paymentAlContadoText) paymentRows.push(['Al contado', paymentAlContadoText, '']);
    newMainHtml += createBlock('payment-options movil', paymentRows);
    newMainHtml += createBlock('payment-options fibra', paymentRows);
  } else {
    // Fallback: create empty payment blocks
    newMainHtml += createBlock('payment-options movil', [['A plazos', '', ''], ['Al contado', '', '']]);
    newMainHtml += createBlock('payment-options fibra', [['A plazos', '', ''], ['Al contado', '', '']]);
  }

  // Pay features
  newMainHtml += '<p><strong>Paga como quieras</strong></p>';
  newMainHtml += '<ul>\n<li>Sin intereses.</li>\n<li>Sin cuota de alta de la financiación.</li>\n</ul>';

  // Process steps
  newMainHtml += '<h2 id="cómo-funciona-el-pago-a-plazos-de-vodafone">¿Cómo funciona el pago a plazos de Vodafone?</h2>';
  const stepCells = [];
  for (let s = 0; s < 4; s++) {
    const icon = STEP_ICONS[s];
    const step = STEP_CONTENT[s];
    let cellContent = `${icon}<br> <strong>${step.title}</strong>`;
    if (step.extra) cellContent += `<br> ${step.extra}`;
    stepCells.push(cellContent);
  }
  newMainHtml += createBlock('columns steps', [stepCells]);

  // Transparency section
  if (transparencyText && transparencyImageSrc && !transparencyImageSrc.startsWith('blob:')) {
    newMainHtml += '<h2 id="somos-transparentes-sin-riesgos-y-sin-permanencia">Somos transparentes, sin riesgos y sin permanencia</h2>';
    newMainHtml += createBlock('columns', [[transparencyText, wrapInPicture(transparencyImageSrc, 'Somos transparentes')]]);
  }

  // Promo cards
  const validPromos = promoItems.filter(p => p.content && p.content.length > 10);
  if (validPromos.length > 0) {
    newMainHtml += '<h2 id="llévatelo-con-estas-promos">Llévatelo con estas promos</h2>';
    const promoRows = validPromos.map(promo => [
      wrapInPicture(promo.image.src, promo.image.alt),
      promo.content,
    ]);
    newMainHtml += createBlock('promo-card', promoRows);
  }

  // Accordion
  if (accordionItems.length > 0) {
    newMainHtml += createBlock('accordion', accordionItems);
  }

  newMainHtml += '</div>\n';

  // Section 3: Metadata
  if (metadataHtml) {
    newMainHtml += `<div>${metadataHtml}</div>\n`;
  }

  $('main').html(newMainHtml);

  return { success: true, html: $.html() };
}

// === MAIN ===
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.find(a => a.startsWith('--file='));
const singleFile = fileArg ? fileArg.split('=')[1] : null;

let files;
if (singleFile) {
  files = [singleFile];
} else {
  files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.html') && !f.endsWith('.plain.html'))
    .map(f => path.join(CONTENT_DIR, f));
}

let processed = 0, skipped = 0, errors = 0;

for (const file of files) {
  const basename = path.basename(file);
  try {
    const result = processPage(file);
    if (result.success) {
      if (!dryRun) {
        fs.writeFileSync(file, result.html);
        const plainFile = file.replace('.html', '.plain.html');
        if (fs.existsSync(plainFile)) {
          const $result = cheerio.load(result.html);
          fs.writeFileSync(plainFile, `<main>${$result('main').html()}</main>`);
        }
      }
      processed++;
      console.log(`✓ ${basename}`);
    } else {
      skipped++;
      if (!result.reason.includes('Not a partially')) {
        console.log(`- ${basename}: ${result.reason}`);
      }
    }
  } catch (e) {
    errors++;
    console.error(`✗ ${basename}: ${e.message}`);
  }
}

console.log(`\nDone. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
