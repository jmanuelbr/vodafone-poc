/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-pricing block
 *
 * Source: https://www.vodafone.es/c/particulares/es/ (tarifas, PDP pages)
 * Base Block: cards-pricing
 *
 * Block Structure:
 * - Each row = one pricing card
 * - Col 1: empty (no image)
 * - Col 2: badge + price + subtitle + features list + CTAs
 *
 * Source HTML Patterns:
 *
 * Pattern A (Tarifas page):
 * .ws10-m-card-rate-list > .ws10-o-layout > .ws10-o-layout__item (x4)
 *   .ws10-m-card-rate-simple with .ws10-c-label-card
 *
 * Pattern B (PDP page):
 * .tariff-card.recommended
 *   span.badge (badge text)
 *   p.tariff-price > strong (price number)
 *   p (subtitle)
 *   ul > li (features)
 *
 * Generated: 2026-02-17 (updated 2026-02-22 for PDP support)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect PDP-style tariff card (.tariff-card or single card without ws10 classes)
  const isPdpCard = element.classList.contains('tariff-card')
    || element.querySelector('.tariff-price')
    || element.querySelector('.badge');

  if (isPdpCard) {
    // Pattern B: PDP single tariff card
    const badgeEl = element.querySelector('.badge, [class*="badge"], span:first-child');
    const badgeText = badgeEl ? badgeEl.textContent.trim() : '';

    const priceEl = element.querySelector('.tariff-price strong, [class*="price"] strong');
    const priceText = priceEl ? priceEl.textContent.trim() : '';

    // Get price unit text (text after strong within price paragraph)
    const pricePara = element.querySelector('.tariff-price, [class*="price"]');
    let unitText = '';
    if (pricePara) {
      const fullText = pricePara.textContent.trim();
      if (priceText) {
        unitText = fullText.replace(priceText, '').trim();
      }
    }

    // Get subtitle (e.g., "Precio final")
    const allParas = element.querySelectorAll('p');
    let subtitleText = 'Precio final';
    allParas.forEach((p) => {
      const text = p.textContent.trim();
      if (text === 'Precio final' || text.toLowerCase().includes('precio')) {
        subtitleText = text;
      }
    });

    // Get features
    const featureItems = element.querySelectorAll('ul li');
    const features = [];
    featureItems.forEach((li) => {
      const text = li.textContent.trim();
      if (text) features.push(text);
    });

    // Build card content using <br><br> separators (cards-pricing expects this format)
    const cellContent = document.createElement('div');
    const p = document.createElement('p');

    if (badgeText) {
      const strong = document.createElement('strong');
      strong.textContent = badgeText;
      p.appendChild(strong);
      p.appendChild(document.createElement('br'));
      p.appendChild(document.createElement('br'));
    }

    const priceStrong = document.createElement('strong');
    priceStrong.textContent = priceText;
    p.appendChild(priceStrong);
    p.appendChild(document.createTextNode(unitText ? `,${unitText}` : ' €/mes'));
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createTextNode(subtitleText));
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createElement('br'));

    if (features.length > 0) {
      const ul = document.createElement('ul');
      features.forEach((feat) => {
        const li = document.createElement('li');
        li.textContent = feat;
        ul.appendChild(li);
      });
      p.appendChild(ul);
    }

    // Add CTA links
    const moreInfo = document.createElement('a');
    moreInfo.href = '#';
    moreInfo.textContent = 'Más info';
    p.appendChild(document.createElement('br'));
    p.appendChild(moreInfo);

    const selectLink = document.createElement('a');
    selectLink.href = '#';
    selectLink.textContent = 'Seleccionado';
    p.appendChild(document.createTextNode(' '));
    p.appendChild(selectLink);

    cellContent.appendChild(p);
    cells.push([cellContent]);

    const block = WebImporter.Blocks.createBlock(document, { name: 'Cards Pricing', cells });
    element.replaceWith(block);
    return;
  }

  // Pattern A: Tarifas page ws10 cards
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
