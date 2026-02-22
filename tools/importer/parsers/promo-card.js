/* eslint-disable */
/* global WebImporter */

/**
 * Parser for promo-card block
 *
 * Source: https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/
 * Base Block: promo-card
 *
 * Block Structure:
 * - Single row with 2 columns
 * - Col 1: Promo image
 * - Col 2: Title + preview text + detailed content (all separated by <br>)
 *   The promo-card.js splits at <br> tags: part 1 = title, part 2 = preview, parts 3+ = collapsible "Ver más"
 *
 * Source HTML Pattern (from cleaned.html):
 * <div class="promo-card">
 *   <h3>Re-estrena, ayuda al planeta y ahorra</h3>
 *   <p>Con Re-estrena de Vodafone Flex recibe 50€...</p>
 *   <p>Es muy fácil:</p>
 *   <ol>
 *     <li>Compra tu nuevo móvil con Vodafone.</li>
 *     <li>En el mail de confirmación...</li>
 *     <li>Entra en el enlace...</li>
 *     <li>Tras comprobar el estado...</li>
 *   </ol>
 *   <p>Además, esta promoción es adicional...</p>
 *   <p>Date prisa, ¡promoción aplicable a unidades limitadas!</p>
 * </div>
 *
 * Generated: 2026-02-22
 */
export default function parse(element, { document }) {
  // Find promo image - may be a sibling or within parent section
  const parentSection = element.closest('section') || element.parentElement;
  const promoImg = parentSection
    ? parentSection.querySelector('img[src*="promo"], img[src*="reestrena"], img[class*="promo"]')
    : null;

  // Also check for image as a preceding sibling or within the card itself
  const cardImg = element.querySelector('img');

  // Build image column
  const imgCol = document.createElement('div');
  const img = promoImg || cardImg;
  if (img) {
    const picture = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.alt = img.alt || 'Re-estrena';
    picture.appendChild(imgEl);
    imgCol.appendChild(picture);
  }

  // Build text column
  // Promo-card block expects content with <br> separators for title/preview/details split
  const textCol = document.createElement('div');

  // Extract title (h3 or first strong)
  const title = element.querySelector('h3, h4, [class*="title"]');
  const titleText = title ? title.textContent.trim() : '';

  // Extract remaining content (paragraphs, lists)
  const contentParts = [];
  const children = element.querySelectorAll(':scope > p, :scope > ol, :scope > ul');

  children.forEach((child) => {
    if (child.tagName === 'OL' || child.tagName === 'UL') {
      // Convert list items to numbered text
      const items = child.querySelectorAll('li');
      items.forEach((item, idx) => {
        const prefix = child.tagName === 'OL' ? `${idx + 1} - ` : '';
        contentParts.push(`${prefix}${item.textContent.trim()}`);
      });
    } else {
      const text = child.textContent.trim();
      if (text) contentParts.push(text);
    }
  });

  // Build the combined text content with <br> separators
  // Format: title<br>preview<br>detail lines
  const p = document.createElement('p');
  if (titleText) {
    const strong = document.createElement('strong');
    strong.textContent = titleText;
    p.appendChild(strong);
  }

  contentParts.forEach((part) => {
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createTextNode(part));
  });

  textCol.appendChild(p);

  const cells = [[imgCol, textCol]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Promo Card', cells });
  element.replaceWith(block);
}
