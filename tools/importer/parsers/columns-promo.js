/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-promo block
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: columns-promo
 *
 * Block Structure:
 * - Single row with 2 columns
 * - Col 1: Image
 * - Col 2: subtitle + title + description + CTA
 *
 * Source HTML Pattern:
 * section.ws10-m-banner-slim.ws10-inverse
 *   img.ws10-c-banner-slim__icon
 *   p.ws10-c-banner-slim__title
 *   div.ws10-c-pill (badge text)
 *   span.ws10-c-banner-slim__text
 *   a.ws10-c-button--secondary (CTA)
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  // Extract image
  const img = element.querySelector('.ws10-c-banner-slim__icon, img');

  // Extract title
  const title = element.querySelector('.ws10-c-banner-slim__title, [class*="banner-slim__title"]');

  // Extract pill/badge text (subtitle)
  const pill = element.querySelector('.ws10-c-pill, [class*="pill"]');

  // Extract description text
  const description = element.querySelector('.ws10-c-banner-slim__text, [class*="banner-slim__text"]');

  // Extract CTA link
  const ctaLink = element.querySelector('a[class*="button"]');

  // Build image column
  const imgCol = document.createElement('div');
  if (img) {
    const picture = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.alt = title ? title.textContent.trim() : '';
    picture.appendChild(imgEl);
    imgCol.appendChild(picture);
  }

  // Build text column
  const textCol = document.createElement('div');

  if (pill) {
    const p = document.createElement('p');
    p.textContent = pill.textContent.trim();
    textCol.appendChild(p);
  }

  if (title) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = title.textContent.trim();
    p.appendChild(strong);
    textCol.appendChild(p);
  }

  if (description) {
    const p = document.createElement('p');
    p.innerHTML = description.innerHTML;
    textCol.appendChild(p);
  }

  if (ctaLink) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = ctaLink.href;
    a.textContent = ctaLink.textContent.trim();
    p.appendChild(a);
    textCol.appendChild(p);
  }

  const cells = [[imgCol, textCol]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Promo', cells });
  element.replaceWith(block);
}
