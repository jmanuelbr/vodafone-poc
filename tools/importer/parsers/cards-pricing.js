/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-pricing block
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: cards-pricing
 *
 * Block Structure:
 * - Each row = one pricing card
 * - Col 1: empty (no image)
 * - Col 2: badge + price + subtitle + features list + CTAs
 *
 * Source HTML Pattern:
 * .ws10-m-card-rate-list > .ws10-o-layout > .ws10-o-layout__item (x4)
 *   Each contains: .ws10-m-card-rate-simple with .ws10-c-label-card
 *   - .ws10-c-label-card__outstanding (optional badge)
 *   - .ws10-c-price__amount (price number)
 *   - ul > li (features)
 *   - a.ws10-c-button--tertiary + a.ws10-c-button--primary (CTAs)
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all pricing cards within the rate list
  const cards = element.querySelectorAll('.ws10-m-card-rate-simple');
  const cardElements = cards.length > 0 ? cards : element.querySelectorAll('.ws10-o-layout__item');

  cardElements.forEach((card) => {
    // Extract badge text (e.g., "Tarifa exclusiva web", "La más vendida")
    const badgeEl = card.querySelector('.ws10-c-label-card__outstanding, [class*="badge"], [class*="label-card__outstanding"]');
    const badgeText = badgeEl ? badgeEl.textContent.trim() : '';

    // Extract price
    const priceAmount = card.querySelector('.ws10-c-price__amount, [class*="price__amount"]');
    const priceText = priceAmount ? priceAmount.textContent.trim() : '';

    // Extract price subtitle (e.g., "Precio final")
    const priceSubtitle = card.querySelector('.ws10-c-price__legal, [class*="price__legal"]');
    const subtitleText = priceSubtitle ? priceSubtitle.textContent.trim() : 'Precio final';

    // Extract features list
    const featureItems = card.querySelectorAll('ul li');
    const featuresHtml = [];
    featureItems.forEach((item) => {
      const text = item.textContent.trim();
      if (text) featuresHtml.push(text);
    });

    // Extract CTA links
    const ctaLinks = card.querySelectorAll('a[class*="button"]');
    const ctas = [];
    ctaLinks.forEach((link) => {
      const text = link.textContent.trim();
      if (text && link.href) {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = text;
        ctas.push(a);
      }
    });

    // Build card content cell
    const cellContent = document.createElement('div');

    if (badgeText) {
      const badgeP = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = badgeText;
      badgeP.appendChild(strong);
      cellContent.appendChild(badgeP);
    }

    if (priceText) {
      const priceP = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = priceText;
      priceP.appendChild(strong);
      priceP.appendChild(document.createTextNode('€/mes'));
      cellContent.appendChild(priceP);
    }

    const subP = document.createElement('p');
    subP.textContent = subtitleText;
    cellContent.appendChild(subP);

    if (featuresHtml.length > 0) {
      const ul = document.createElement('ul');
      featuresHtml.forEach((feat) => {
        const li = document.createElement('li');
        li.textContent = feat;
        ul.appendChild(li);
      });
      cellContent.appendChild(ul);
    }

    if (ctas.length > 0) {
      const ctaP = document.createElement('p');
      ctas.forEach((a) => ctaP.appendChild(a));
      cellContent.appendChild(ctaP);
    }

    // Row: [empty image col, content col]
    cells.push([document.createElement('div'), cellContent]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Pricing', cells });
  element.replaceWith(block);
}
