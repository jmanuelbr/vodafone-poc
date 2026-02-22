/* eslint-disable */
/* global WebImporter */

/**
 * Parser for product-gallery block
 *
 * Source: https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/
 * Base Block: product-gallery
 *
 * Block Structure:
 * - 1 column layout
 * - Each row contains one product image
 * - First image becomes the main display, rest are thumbnails
 *
 * Source HTML Pattern (from cleaned.html):
 * <div class="product-gallery">
 *   <img src="..." alt="Redmi Note 15 Pro 5G - Frontal">
 *   <img src="..." alt="Redmi Note 15 Pro 5G - Trasera">
 *   <img src="..." alt="Redmi Note 15 Pro 5G - Lateral">
 *   <img src="..." alt="Redmi Note 15 Pro 5G - Canto">
 * </div>
 *
 * Generated: 2026-02-22
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all product images within the gallery container
  // VALIDATED: cleaned.html has <img> tags directly inside .product-gallery
  const images = element.querySelectorAll('img');

  images.forEach((img) => {
    if (!img.src) return;

    const picture = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.alt = img.alt || '';
    picture.appendChild(imgEl);

    cells.push([picture]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Product Gallery', cells });
  element.replaceWith(block);
}
