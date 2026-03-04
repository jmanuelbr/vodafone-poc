/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS - Import all parsers needed for this template
import productGalleryParser from './parsers/product-gallery.js';
import customerTabsParser from './parsers/customer-tabs.js';
import tariffFilterParser from './parsers/tariff-filter.js';
import cardsPricingParser from './parsers/cards-pricing.js';
import paymentOptionsParser from './parsers/payment-options.js';
import columnsStepsParser from './parsers/columns-steps.js';
import columnsParser from './parsers/columns.js';
import promoCardParser from './parsers/promo-card.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS - Import all transformers found in tools/importer/transformers/
import vodafoneCleanupTransformer from './transformers/vodafone-cleanup.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'product-gallery': productGalleryParser,
  'customer-tabs': customerTabsParser,
  'tariff-filter': tariffFilterParser,
  'cards-pricing': cardsPricingParser,
  'payment-options': paymentOptionsParser,
  'columns-steps': columnsStepsParser,
  'columns': columnsParser,
  'promo-card': promoCardParser,
  'accordion': accordionParser,
};

// TRANSFORMER REGISTRY - Array of transformer functions
const transformers = [
  vodafoneCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'product-detail-page',
  description: 'Vodafone product detail page (PDP) for mobile phones with product gallery, tariff pricing cards, payment options, purchase process steps, promotions, and specifications accordion',
  urls: [
    'https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/',
    'https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/samsung-galaxy-a56-5g-negro-256gb-315792/',
    'https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/oppo-a6-pro-5g-negro-azul-256gb-316284/',
    'https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/oppo-reno-14-fs-5g-verde-512gb-316150/',
  ],
  blocks: [
    {
      name: 'product-gallery',
      instances: ['.mva10-c-image-gallery', 'ftol-ficha-image-gallery'],
    },
    {
      name: 'customer-tabs',
      instances: ['ftol-register-type-tabs', 'mva10-c-tabs-simple'],
    },
    {
      name: 'tariff-filter',
      instances: ['ftol-selector-tarifa', 'mva10-c-filter'],
    },
    {
      name: 'cards-pricing',
      instances: ['ftol-tarifa-cards'],
    },
    {
      name: 'payment-options',
      instances: ['ftol-price-contado-plazos'],
    },
    {
      name: 'columns-steps',
      instances: ['ftol-time-line-two-step-sales', 'mva10-c-timeline-steps'],
    },
    {
      name: 'columns',
      instances: ['ftol-no-surprises-two-step-sales'],
    },
    {
      name: 'promo-card',
      instances: ['ftol-ficha-promotions'],
    },
    {
      name: 'accordion',
      instances: ['ftol-ficha-characteristics', 'mva10-c-accordion'],
    },
    {
      name: 'section-product-details',
      instances: ['ftol-ficha-characteristics'],
      section: '',
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, payload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    // Skip section-only entries (no parser needed)
    if (blockDef.name.startsWith('section-')) {
      return;
    }

    blockDef.instances.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null,
          });
        });
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`, e);
      }
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Main transformation function using one input / multiple outputs pattern
   */
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (full localized path without extension)
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
