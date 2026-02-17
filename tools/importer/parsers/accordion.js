/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion block
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: accordion
 *
 * Block Structure:
 * - Each row = one accordion item
 * - Col 1: Question text
 * - Col 2: Answer content (rich text with links)
 *
 * Source HTML Pattern:
 * section.ws10-m-accordion
 *   ul.ws10-m-accordion__list-group-list > li (x9)
 *     section.ws10-c-accordion-list
 *       button > h3 > span.ws10-c-accordion-list__title (question)
 *       div[data-ws10-js="collapse"] (answer panel with rich text)
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all accordion items
  const items = element.querySelectorAll('.ws10-c-accordion-list, li');

  items.forEach((item) => {
    // Extract question
    const questionEl = item.querySelector('.ws10-c-accordion-list__title, h3, summary, [class*="title"]');
    const questionText = questionEl ? questionEl.textContent.trim() : '';

    if (!questionText) return;

    // Extract answer content
    const answerEl = item.querySelector('[data-ws10-js="collapse"], .ws10-c-accordion-list__body, [class*="body"], [class*="content"]');

    // Build question cell
    const questionCell = document.createElement('div');
    questionCell.textContent = questionText;

    // Build answer cell - preserve rich text (links, bold, lists)
    const answerCell = document.createElement('div');
    if (answerEl) {
      // Clone answer content to preserve rich HTML
      const clone = answerEl.cloneNode(true);
      // Remove any toggle buttons or icons from the cloned content
      const buttonsAndIcons = clone.querySelectorAll('button, svg, [class*="chevron"], [class*="icon"]');
      buttonsAndIcons.forEach((el) => el.remove());
      answerCell.innerHTML = clone.innerHTML;
    }

    cells.push([questionCell, answerCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
  element.replaceWith(block);
}
