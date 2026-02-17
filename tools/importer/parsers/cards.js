/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards (advantages) block
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: cards
 *
 * Block Structure:
 * - Each row = one advantage card
 * - Col 1: Icon image
 * - Col 2: Title + description + optional CTA
 *
 * Source HTML Pattern:
 * section.ws10-m-addons
 *   ul.ws10-c-carousel__list > li (x4)
 *     div.ws10-c-card-addons
 *       p.ws10-c-card-addons__box > svg + span.ws10-c-card-addons__title > strong
 *       p.ws10-c-card-addons__paragraph
 *       div.ws10-m-addons__container-buttons > a
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all advantage cards
  const cards = element.querySelectorAll('.ws10-c-card-addons, .ws10-c-card');

  cards.forEach((card) => {
    // Extract icon
    const svg = card.querySelector('svg, .ws10-c-card-addons__icon');
    const img = card.querySelector('img');

    // Extract title
    const titleEl = card.querySelector('.ws10-c-card-addons__title strong, .ws10-c-card-addons__title, [class*="title"] strong');
    const titleText = titleEl ? titleEl.textContent.trim() : '';

    if (!titleText) return;

    // Extract description
    const descEl = card.querySelector('.ws10-c-card-addons__paragraph, p:not([class*="box"])');
    const descText = descEl ? descEl.textContent.trim() : '';

    // Extract CTA link
    const ctaLink = card.querySelector('.ws10-m-addons__container-buttons a, a[href]');

    // Build icon column
    const iconCol = document.createElement('div');
    if (img) {
      const picture = document.createElement('picture');
      const imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = titleText;
      picture.appendChild(imgEl);
      iconCol.appendChild(picture);
    } else if (svg) {
      const useEl = svg.querySelector ? svg.querySelector('use') : null;
      if (useEl) {
        const href = useEl.getAttribute('xlink:href') || useEl.getAttribute('href') || '';
        const iconName = href.replace('#', '');
        const imgEl = document.createElement('img');
        imgEl.src = `/icons/${iconName}.svg`;
        imgEl.alt = titleText;
        iconCol.appendChild(imgEl);
      }
    }

    // Build text column
    const textCol = document.createElement('div');

    const titleP = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = titleText;
    titleP.appendChild(strong);
    textCol.appendChild(titleP);

    if (descText) {
      const descP = document.createElement('p');
      descP.textContent = descText;
      textCol.appendChild(descP);
    }

    if (ctaLink && ctaLink.href) {
      const ctaP = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaLink.href;
      a.textContent = ctaLink.textContent.trim();
      ctaP.appendChild(a);
      textCol.appendChild(ctaP);
    }

    cells.push([iconCol, textCol]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
