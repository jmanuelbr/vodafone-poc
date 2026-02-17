/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns block (SEO content sections)
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: columns
 *
 * Block Structure:
 * - Single row with 2 columns
 * - Col 1: H2 heading + rich text (paragraphs, lists, links)
 * - Col 2: Image
 *
 * Source HTML Pattern:
 * section.ws10-m-text-image
 *   div.ws10-m-text-image__content-text
 *     section.ws10-c-title-standard > h2 (heading)
 *     span.ws10-m-text-image__paragraph (rich text body)
 *   picture.ws10-m-text-image__content-img > img
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  // Extract heading
  const heading = element.querySelector('.ws10-c-title-standard__title, h2, [class*="title"]');

  // Extract text content area
  const textArea = element.querySelector('.ws10-m-text-image__paragraph, [class*="paragraph"], [class*="content-text"]');

  // Extract image
  const img = element.querySelector('.ws10-m-text-image__img, img');

  // Build text column
  const textCol = document.createElement('div');

  if (heading) {
    const h2 = document.createElement('h2');
    const strong = document.createElement('strong');
    strong.textContent = heading.textContent.trim();
    h2.appendChild(strong);
    textCol.appendChild(h2);
  }

  if (textArea) {
    // Clone to preserve rich HTML (paragraphs, lists, links, bold text)
    const clone = textArea.cloneNode(true);
    // Import all children to textCol
    while (clone.firstChild) {
      textCol.appendChild(clone.firstChild);
    }
  }

  // Build image column
  const imgCol = document.createElement('div');
  if (img) {
    const picture = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.alt = img.alt || (heading ? heading.textContent.trim() : '');
    picture.appendChild(imgEl);
    imgCol.appendChild(picture);
  }

  const cells = [[textCol, imgCol]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
