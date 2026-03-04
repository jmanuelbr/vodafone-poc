#!/usr/bin/env node
/**
 * Post-processes bulk-imported PDP pages to restructure flat HTML
 * into proper EDS block table format matching the reference OPPO page structure.
 *
 * Usage: node tools/post-process-pdp.js [--dry-run] [--file path/to/file.html]
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = '/workspace/content/c/tienda-online/autonomos/catalogo-moviles';
const OPPO_REFERENCE = 'oppo-reno-14-fs-5g-verde-512gb-316150.html';

// Icon tokens for the benefits bar
const BENEFIT_ICONS = {
  'Pago a plazos sin intereses': ':price-promise:',
  'Trae tu móvil y ahorra': ':trade-in:',
  'Ver todos los beneficios': ':benefits:',
};

// Step icons for process steps
const STEP_ICONS = [':shopping-trolley:', ':bundles:', ':mail:', ':delivery:'];

// Step titles/content for the process steps (from reference)
const STEP_CONTENT = [
  { title: 'Realiza tu pedido' },
  { title: 'Recibirás tu SIM en 2-4 días', extra: 'y activaremos tu línea lo antes posible' },
  { title: 'Accede a tu app', extra: 'Accede a tu espacio personal en la app. Tu dispositivo estará esperando' },
  { title: 'Confirma la compra', extra: 'y recíbelo' },
];

/**
 * Wrap an image URL in a <picture> element HTML string
 */
function wrapInPicture(src, alt, loading = 'lazy') {
  return `<picture><source srcset="${src}"><source srcset="${src}" media="(min-width: 600px)"><img src="${src}" alt="${alt}" loading="${loading}"></picture>`;
}

/**
 * Create an EDS block table structure
 * @param {string} blockName - Block name with optional variants (e.g., "cards-pricing movil")
 * @param {Array<Array<string>>} rows - Array of rows, each row is array of cell HTML strings
 */
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

/**
 * Extract text content from a cheerio element, trimmed
 */
function text($el) {
  return $el.text().trim();
}

/**
 * Check if an element is a heading with specific text content
 */
function isHeadingWithText($, el, textPattern) {
  const tagName = el.tagName || (el[0] && el[0].tagName) || '';
  if (!tagName.match(/^h[1-6]$/i)) return false;
  const t = $(el).text().trim();
  if (typeof textPattern === 'string') return t.includes(textPattern);
  return textPattern.test(t);
}

/**
 * Process a single PDP page
 */
function processPage(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false, xmlMode: false });

  const main = $('main');
  if (!main.length) return { success: false, reason: 'No main found' };

  const mainDiv = main.children('div').first();
  if (!mainDiv.length) return { success: false, reason: 'No main > div found' };

  // Skip the OPPO reference page
  if (filePath.includes('oppo-reno-14-fs-5g-verde-512gb-316150')) {
    return { success: false, reason: 'Skipping reference page' };
  }

  // Check across ALL main content (not just first div) for proper block structure
  const hasCardsPricing = main.find('.cards-pricing').length > 0;
  const hasBreadcrumb = main.find('.breadcrumb').length > 0;
  const hasColumnsSteps = main.find('.columns.steps').length > 0;
  if (hasCardsPricing && hasBreadcrumb && hasColumnsSteps) {
    return { success: false, reason: 'Page already has proper block structure' };
  }

  // Also check if page has very little content (corrupted by double-processing)
  const allText = main.text().trim();
  if (allText.length < 200 && !main.find('h1').length) {
    return { success: false, reason: 'Page has insufficient content for processing' };
  }

  // Collect all direct children of main div
  const children = mainDiv.children().toArray();

  // === EXTRACTION PHASE ===
  // Walk through children and identify content sections

  let breadcrumbUl = null;
  let benefitsUl = null;
  let productTitle = null;
  let priceSummary = null;
  let discountText = null;
  let mainImage = null;
  let galleryImages = [];
  let customerTabLabels = [];
  let movilPricingCards = [];
  let fibraPricingCards = [];
  let paymentAPlazos = null;
  let paymentAlContado = null;
  let promoSections = [];
  let processSteps = [];
  let specsBlock = null;
  let moreInfoContent = [];
  let metadataBlock = null;
  let tariffHeading = null;
  let paymentHeading = null;
  let transparencyText = null;
  let transparencyImage = null;

  let state = 'START';
  let promoHeadingFound = false;
  let promoCurrentImage = null;
  let promoCurrentContent = [];

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const $el = $(el);
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    const textContent = $el.text().trim();
    const htmlContent = $.html(el);

    // Skip empty elements
    if (!textContent && !$el.find('img').length && !$el.hasClass('metadata') && !$el.hasClass('sistema') && !$el.hasClass('product-gallery')) {
      continue;
    }

    // === METADATA BLOCK (always at end) ===
    if ($el.hasClass('metadata')) {
      metadataBlock = htmlContent;
      continue;
    }

    // === EMPTY PRODUCT-GALLERY (from failed parser) ===
    if ($el.hasClass('product-gallery') && $el.children().length === 0) {
      continue; // Skip empty product gallery
    }

    // === SISTEMA BLOCK (specs - rename to accordion) ===
    if ($el.hasClass('sistema')) {
      specsBlock = $el;
      continue;
    }

    // === DUPLICATE BREADCRUMB AT BOTTOM ===
    if (tag === 'ol' && $el.find('a[href*="vodafone.es"]').length >= 3) {
      continue; // Skip duplicate breadcrumb
    }

    // === BREADCRUMB ===
    if (state === 'START' && tag === 'ul' && $el.find('a[href*="vodafone.es"]').length >= 2) {
      breadcrumbUl = htmlContent;
      state = 'AFTER_BREADCRUMB';
      continue;
    }

    // === BENEFITS BAR ===
    if (state === 'AFTER_BREADCRUMB' && tag === 'ul') {
      const items = $el.find('li');
      if (items.length >= 2 && items.length <= 4) {
        const hasIcons = items.toArray().some(li => $(li).text().includes('Pago a plazos') || $(li).text().includes('Trae tu móvil'));
        if (hasIcons) {
          benefitsUl = $el;
          state = 'AFTER_BENEFITS';
          continue;
        }
      }
    }

    // === PRODUCT TITLE ===
    if ((state === 'AFTER_BENEFITS' || state === 'AFTER_BREADCRUMB') && tag === 'h1') {
      productTitle = $el;
      state = 'AFTER_TITLE';
      continue;
    }

    // === DISCOUNT TEXT (em/italic before or after title) ===
    if (state === 'AFTER_BENEFITS' && tag === 'p' && $el.find('em').length > 0) {
      discountText = htmlContent;
      continue;
    }

    // === PRICE SUMMARY ===
    if (state === 'AFTER_TITLE' && tag === 'p' && (textContent.includes('desde') || textContent.includes('€/mes'))) {
      priceSummary = htmlContent;
      state = 'AFTER_PRICE';
      continue;
    }

    // === TAX NOTE ===
    if (state === 'AFTER_PRICE' && tag === 'p' && textContent.includes('Precios sin IVA')) {
      // Keep this text, we'll add it to the product info section
      state = 'GALLERY_SEARCH';
      continue;
    }

    // === MAIN PRODUCT IMAGE ===
    if ((state === 'AFTER_PRICE' || state === 'GALLERY_SEARCH') && tag === 'p' && $el.find('img').length > 0) {
      const img = $el.find('img').first();
      mainImage = { src: img.attr('src'), alt: img.attr('alt') || '' };
      state = 'GALLERY_SEARCH';
      continue;
    }

    // === GALLERY THUMBNAILS ===
    if (state === 'GALLERY_SEARCH' && tag === 'ul' && $el.find('li img').length >= 2) {
      $el.find('li img').each((_, img) => {
        galleryImages.push({ src: $(img).attr('src'), alt: $(img).attr('alt') || '' });
      });
      state = 'AFTER_GALLERY';
      continue;
    }

    // === CAPACITY/COLOR SELECTORS (skip interactive elements) ===
    if ((state === 'AFTER_GALLERY' || state === 'GALLERY_SEARCH') && tag === 'p') {
      if (textContent === 'Capacidad' || textContent === 'Color') {
        state = 'SKIP_SELECTORS';
        continue;
      }
      if (state === 'SKIP_SELECTORS' && $el.find('a[href*="catalogo-moviles"]').length > 0) {
        continue; // Skip capacity/color link options
      }
    }
    if (state === 'SKIP_SELECTORS' && tag === 'p') {
      if (textContent === 'Color') continue;
      if ($el.find('a[href*="catalogo-moviles"]').length > 0) continue;
      if (textContent === '¡Novedad!' || textContent === '¡Oferta!' || textContent.startsWith('¡')) {
        continue; // Skip badges
      }
    }

    // === BADGE ===
    if (tag === 'p' && (textContent === '¡Novedad!' || textContent === '¡Oferta!' || textContent.startsWith('¡') && textContent.endsWith('!'))) {
      continue; // Skip badges
    }

    // === RE-ESTRENA SECTION (skip entire interactive trade-in section) ===
    if (tag === 'h5' && textContent.includes('Re-estrena')) {
      state = 'SKIP_REESTRENA';
      continue;
    }
    if (state === 'SKIP_REESTRENA') {
      if (textContent === 'Aceptar') {
        state = 'AFTER_REESTRENA';
        continue;
      }
      // Also check if we hit a h2 heading (Re-estrena section ended without "Aceptar")
      if (tag === 'h2') {
        state = 'AFTER_REESTRENA';
        // Don't continue - process this h2 below
      } else {
        continue; // Skip Re-estrena content
      }
    }

    // === TARIFF SECTION HEADING ===
    if (tag === 'h2' && textContent.includes('tarifa quieres comprar')) {
      tariffHeading = htmlContent;
      state = 'TARIFF_SECTION';
      continue;
    }

    // === CUSTOMER TAB LABELS ===
    if (state === 'TARIFF_SECTION' && tag === 'p') {
      const cleanText = textContent.replace(/^\|?\s*/, '');
      if (cleanText === 'Mantener mi número' || cleanText === 'Nuevo número' || cleanText === 'Ya soy cliente' || cleanText === 'No soy cliente') {
        customerTabLabels.push(cleanText);
        continue;
      }
    }

    // === TARIFF TYPE LABELS AND PRICING CARDS ===
    if (tag === 'p' && textContent === 'Tarifas Móvil') {
      state = 'MOVIL_PRICING';
      continue;
    }
    if (state === 'MOVIL_PRICING' && tag === 'ul') {
      const seenMovil = new Set();
      $el.find('li').each((_, li) => {
        const firstP = $(li).find('p').first().text().trim();
        if (!seenMovil.has(firstP)) {
          seenMovil.add(firstP);
          movilPricingCards.push($(li).html());
        }
      });
      state = 'AFTER_MOVIL';
      continue;
    }

    if (tag === 'p' && textContent === 'Tarifas Fibra y Móvil') {
      state = 'FIBRA_PRICING';
      continue;
    }
    if (state === 'FIBRA_PRICING' && tag === 'ul') {
      const seenFibra = new Set();
      $el.find('li').each((_, li) => {
        const firstP = $(li).find('p').first().text().trim();
        if (!seenFibra.has(firstP)) {
          seenFibra.add(firstP);
          fibraPricingCards.push($(li).html());
        }
      });
      state = 'AFTER_FIBRA';
      continue;
    }

    // === PAYMENT SECTION ===
    if (tag === 'h2' && textContent.includes('quieres pagar')) {
      paymentHeading = htmlContent;
      state = 'PAYMENT_SECTION';
      continue;
    }
    if (state === 'PAYMENT_SECTION' && tag === 'p') {
      if (textContent.startsWith('A plazos') || textContent.includes('€/mes')) {
        if (!paymentAPlazos) {
          paymentAPlazos = htmlContent;
          continue;
        }
      }
      if (textContent.startsWith('Al contado') || (paymentAPlazos && !paymentAlContado && textContent.includes('€'))) {
        paymentAlContado = htmlContent;
        state = 'AFTER_PAYMENT';
        continue;
      }
    }

    // === "PAGA COMO QUIERAS" section ===
    if (tag === 'p' && textContent === 'Paga como quieras') {
      state = 'PAGA_SECTION';
      continue;
    }
    if (state === 'PAGA_SECTION' && tag === 'ul') {
      // payment features list - skip (will use from reference)
      state = 'AFTER_PAGA';
      continue;
    }

    // === "CONFIGURA TU PAGO" button ===
    if (tag === 'p' && textContent === 'Configura tu pago') {
      continue; // Skip interactive button text
    }

    // === FINANCIACION HEADING (empty - skip) ===
    if (tag === 'h2' && textContent.includes('financiación en Vodafone')) {
      continue;
    }

    // === PROMO SECTION ===
    if (tag === 'h2' && (textContent.includes('promos') || textContent.includes('promociones'))) {
      promoHeadingFound = true;
      state = 'PROMO_SECTION';
      continue;
    }
    if (state === 'PROMO_SECTION') {
      // Collect promo images and text
      if (tag === 'p' && $el.find('img').length > 0) {
        // Save current promo if we have content
        if (promoCurrentImage && promoCurrentContent.length > 0) {
          promoSections.push({ image: promoCurrentImage, content: promoCurrentContent.join('<br>') });
          promoCurrentContent = [];
        }
        const img = $el.find('img').first();
        promoCurrentImage = { src: img.attr('src'), alt: img.attr('alt') || '' };
        continue;
      }
      if (tag === 'p' && promoCurrentImage) {
        promoCurrentContent.push($.html($el.children().length > 0 ? $el.contents() : $el).replace(/^<p>|<\/p>$/g, ''));
        continue;
      }
      // End of promo section when we hit a h2
      if (tag === 'h2') {
        if (promoCurrentImage && promoCurrentContent.length > 0) {
          promoSections.push({ image: promoCurrentImage, content: promoCurrentContent.join('<br>') });
        }
        promoCurrentImage = null;
        promoCurrentContent = [];
        state = 'AFTER_PROMO';
        // Don't continue - process this heading below
      }
    }

    // === TRANSPARENCY SECTION ===
    if (tag === 'h2' && textContent.includes('transparentes')) {
      state = 'TRANSPARENCY';
      continue;
    }
    if (state === 'TRANSPARENCY') {
      if (tag === 'p' && $el.find('img').length > 0) {
        const img = $el.find('img').first();
        transparencyImage = { src: img.attr('src'), alt: img.attr('alt') || 'Somos transparentes' };
        state = 'AFTER_TRANSPARENCY';
        continue;
      }
      if (tag === 'p') {
        transparencyText = (transparencyText || '') + htmlContent;
        continue;
      }
    }

    // === PROCESS SECTION ===
    if (tag === 'h2' && (textContent.includes('proceso de compra') || textContent.includes('Cómo es el proceso'))) {
      state = 'PROCESS_STEPS';
      continue;
    }
    if (state === 'PROCESS_STEPS' && tag === 'h3') {
      if (textContent === 'Especificaciones' || textContent === 'Más información') {
        state = 'SPECS_SECTION';
        // Don't continue - process below
      } else {
        // Collect step heading
        const nextEl = children[i + 1];
        const nextText = nextEl ? $(nextEl).text().trim() : '';
        processSteps.push({ title: textContent, description: nextText });
        continue;
      }
    }
    if (state === 'PROCESS_STEPS' && tag === 'p') {
      // Step description - already captured in previous step
      if (processSteps.length > 0) continue;
    }

    // === SPECS AND MORE INFO ===
    if (tag === 'h3' && textContent === 'Especificaciones') {
      state = 'SPECS_SECTION';
      continue;
    }
    if (tag === 'h3' && textContent === 'Más información') {
      state = 'MORE_INFO';
      continue;
    }
    if (state === 'MORE_INFO' && (tag === 'p' || tag === 'ul' || tag === 'ol')) {
      // Skip duplicate breadcrumb
      if (tag === 'ol' && $el.find('a[href*="vodafone.es"]').length >= 3) continue;
      moreInfoContent.push(htmlContent);
      continue;
    }
  }

  // === RECONSTRUCTION PHASE ===

  // Build the new main content
  let newMainHtml = '';

  // --- Section 1: Breadcrumb ---
  if (breadcrumbUl) {
    newMainHtml += `<div>${createBlock('breadcrumb', [[breadcrumbUl.replace(/^<ul/, '<ul').replace(/<\/ul>$/, '</ul>')]])}</div>\n`;
  }

  // --- Section 2: Main content ---
  newMainHtml += '<div>';

  // Benefits bar with icons
  if (benefitsUl) {
    let benefitsHtml = '<ul>\n';
    benefitsUl.find('li').each((_, li) => {
      const liText = $(li).text().trim();
      const icon = BENEFIT_ICONS[liText] || '';
      benefitsHtml += `<li>${icon ? icon + ' ' : ''}${liText}</li>\n`;
    });
    benefitsHtml += '</ul>';
    newMainHtml += benefitsHtml;
  }

  // Discount text if present
  if (discountText) {
    newMainHtml += discountText;
  }

  // Product title
  if (productTitle) {
    newMainHtml += $.html(productTitle);
  }

  // Price summary
  if (priceSummary) {
    newMainHtml += priceSummary;
  }

  // Tax note
  newMainHtml += '<p>Precios sin IVA</p>';

  // Product gallery block
  const allGalleryImages = [];
  if (mainImage) {
    allGalleryImages.push(mainImage);
  }
  galleryImages.forEach(img => {
    // Avoid duplicates (main image is often same as first thumbnail)
    if (!allGalleryImages.some(existing => existing.src === img.src)) {
      allGalleryImages.push(img);
    }
  });

  if (allGalleryImages.length > 0) {
    const galleryRows = allGalleryImages.map(img => {
      return [wrapInPicture(img.src, img.alt)];
    });
    newMainHtml += createBlock('product-gallery', galleryRows);
  }

  // Tariff section heading
  if (tariffHeading) {
    newMainHtml += tariffHeading;
  } else {
    newMainHtml += '<h2 id="con-qué-tarifa-quieres-comprar-tu-smartphone">¿Con qué tarifa quieres comprar tu Smartphone?</h2>';
  }

  // Customer tabs block
  const customerTabRows = [
    ['No soy cliente', 'active'],
    ['Ya soy cliente', '¿Eres cliente? Accede a la app y disfruta de precios exclusivos <a href="https://www.vodafone.es/c/empresas/autonomos/es/mi-vodafone/">Ir a la App Mi Vodafone</a>'],
  ];
  newMainHtml += createBlock('customer-tabs', customerTabRows);

  // Tariff filter block
  const filterRows = [
    ['Tarifas Móvil', 'active'],
    ['Tarifas Fibra y Móvil', ''],
  ];
  newMainHtml += createBlock('tariff-filter', filterRows);

  // Cards pricing (movil)
  if (movilPricingCards.length > 0) {
    const movilRows = movilPricingCards.map(cardHtml => {
      return ['', cardHtml];
    });
    newMainHtml += createBlock('cards-pricing movil', movilRows);
  }

  // Cards pricing (fibra)
  if (fibraPricingCards.length > 0) {
    const fibraRows = fibraPricingCards.map(cardHtml => {
      return ['', cardHtml];
    });
    newMainHtml += createBlock('cards-pricing fibra', fibraRows);
  }

  // Payment section heading
  newMainHtml += '<h2 id="cómo-quieres-pagar">¿Cómo quieres pagar?</h2>';

  // Payment options (movil)
  if (paymentAPlazos || paymentAlContado) {
    const paymentMovilRows = [];
    if (paymentAPlazos) {
      const $ap = cheerio.load(paymentAPlazos);
      paymentMovilRows.push(['A plazos', $ap.text().replace('A plazos', '').trim(), '']);
    }
    if (paymentAlContado) {
      const $ac = cheerio.load(paymentAlContado);
      paymentMovilRows.push(['Al contado', $ac.text().replace('Al contado', '').trim(), '']);
    }
    newMainHtml += createBlock('payment-options movil', paymentMovilRows);

    // Payment options (fibra) - create a similar structure with placeholder
    newMainHtml += createBlock('payment-options fibra', paymentMovilRows);
  }

  // Pay features
  newMainHtml += '<p><strong>Paga como quieras</strong></p>';
  newMainHtml += '<ul>\n<li>Sin intereses.</li>\n<li>Sin cuota de alta de la financiación.</li>\n</ul>';

  // Process steps heading
  newMainHtml += '<h2 id="cómo-funciona-el-pago-a-plazos-de-vodafone">¿Cómo funciona el pago a plazos de Vodafone?</h2>';

  // Columns steps block
  const stepCells = [];
  for (let s = 0; s < 4; s++) {
    const icon = STEP_ICONS[s] || ':shopping-trolley:';
    const step = STEP_CONTENT[s];
    let cellContent = `${icon}<br> <strong>${step.title}</strong>`;
    if (step.extra) cellContent += `<br> ${step.extra}`;
    stepCells.push(cellContent);
  }
  newMainHtml += createBlock('columns steps', [stepCells]);

  // Transparency section (if found)
  if (transparencyText || transparencyImage) {
    newMainHtml += '<h2 id="somos-transparentes-sin-riesgos-y-sin-permanencia">Somos transparentes, sin riesgos y sin permanencia</h2>';
    const col1 = transparencyText || 'Estamos convencidos de que nuestras ofertas son las mejores para ti.';
    const col2 = transparencyImage
      ? wrapInPicture(transparencyImage.src, transparencyImage.alt)
      : '';
    if (col2) {
      newMainHtml += createBlock('columns', [[col1, col2]]);
    }
  }

  // Promo section
  if (promoSections.length > 0) {
    newMainHtml += '<h2 id="llévatelo-con-estas-promos">Llévatelo con estas promos</h2>';
    const promoRows = promoSections.map(promo => {
      return [
        wrapInPicture(promo.image.src, promo.image.alt),
        promo.content,
      ];
    });
    newMainHtml += createBlock('promo-card', promoRows);
  }

  // Accordion block (specs + more info)
  const accordionRows = [];
  if (specsBlock) {
    // Extract specs content from the sistema div
    let specsContent = '';
    specsBlock.children('div').each((_, row) => {
      const cols = $(row).children('div');
      if (cols.length >= 2) {
        const label = $(cols[0]).text().trim();
        const value = $(cols[1]).text().trim();
        specsContent += `<strong>${label}:</strong> ${value} `;
      }
    });
    if (specsContent) {
      accordionRows.push(['Especificaciones', specsContent.trim()]);
    }
  }
  if (moreInfoContent.length > 0) {
    accordionRows.push(['Más información', moreInfoContent.join(' ')]);
  }
  if (accordionRows.length > 0) {
    newMainHtml += createBlock('accordion', accordionRows);
  }

  newMainHtml += '</div>\n';

  // --- Section 3: Metadata ---
  if (metadataBlock) {
    newMainHtml += `<div>${metadataBlock}</div>\n`;
  }

  // === WRITE PHASE ===
  $('main').html(newMainHtml);

  return { success: true, html: $.html() };
}

// === MAIN EXECUTION ===
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

let processed = 0;
let skipped = 0;
let errors = 0;

for (const file of files) {
  const basename = path.basename(file);
  try {
    const result = processPage(file);
    if (result.success) {
      if (!dryRun) {
        fs.writeFileSync(file, result.html);
        // Also update the .plain.html file if it exists
        const plainFile = file.replace('.html', '.plain.html');
        if (fs.existsSync(plainFile)) {
          // Extract just the main content for .plain.html
          const $result = cheerio.load(result.html);
          const mainContent = $result('main').html();
          fs.writeFileSync(plainFile, `<main>${mainContent}</main>`);
        }
      }
      processed++;
      console.log(`✓ ${basename}`);
    } else {
      skipped++;
      console.log(`- ${basename}: ${result.reason}`);
    }
  } catch (e) {
    errors++;
    console.error(`✗ ${basename}: ${e.message}`);
  }
}

console.log(`\nDone. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
