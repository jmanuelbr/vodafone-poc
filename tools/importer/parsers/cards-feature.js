/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-feature block
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: cards-feature
 *
 * Block Structure:
 * - Each row = one feature pill
 * - Col 1: Icon image
 * - Col 2: Bold feature text
 *
 * Source HTML Pattern:
 * section.ws10-m-mobile-pdp-one
 *   ul.ws10-m-product-detail-simple__container > li (x4)
 *     div.ws10-c-product-detail
 *       div.ws10-c-product-detail__icon > svg
 *       p.ws10-c-product-detail__text > strong
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all feature items
  const items = element.querySelectorAll('.ws10-c-product-detail');
  const featureItems = items.length > 0 ? items : element.querySelectorAll('li');

  featureItems.forEach((item) => {
    // Extract icon - may be SVG or img
    const img = item.querySelector('img');
    const svg = item.querySelector('svg');

    // Extract text
    const textEl = item.querySelector('.ws10-c-product-detail__text strong, .ws10-c-product-detail__text, strong');
    const text = textEl ? textEl.textContent.trim() : '';

    if (!text) return;

    // Build icon column
    const iconCol = document.createElement('div');
    if (img) {
      const picture = document.createElement('picture');
      const imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = text;
      picture.appendChild(imgEl);
      iconCol.appendChild(picture);
    } else if (svg) {
      const useEl = svg.querySelector('use');
      if (useEl) {
        const href = useEl.getAttribute('xlink:href') || useEl.getAttribute('href') || '';
        const iconName = href.replace('#', '');
        const imgEl = document.createElement('img');
        imgEl.src = `/icons/${iconName}.svg`;
        imgEl.alt = text;
        iconCol.appendChild(imgEl);
      }
    }

    // Build text column
    const textCol = document.createElement('div');
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = text;
    p.appendChild(strong);
    textCol.appendChild(p);

    cells.push([iconCol, textCol]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Feature', cells });
  element.replaceWith(block);
}
