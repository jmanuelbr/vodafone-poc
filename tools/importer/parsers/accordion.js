/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion block
 *
 * Source: https://www.vodafone.es/c/particulares/es/ (tarifas, PDP pages)
 * Base Block: accordion
 *
 * Block Structure:
 * - Each row = one accordion item
 * - Col 1: Title text
 * - Col 2: Content (rich text, spec tables, descriptions)
 *
 * Source HTML Patterns:
 *
 * Pattern A (Tarifas page - ws10 accordion):
 * section.ws10-m-accordion
 *   ul > li > section.ws10-c-accordion-list
 *     button > h3 > span.ws10-c-accordion-list__title (question)
 *     div[data-ws10-js="collapse"] (answer panel)
 *
 * Pattern B (PDP page - h3 + content sections):
 * <section>
 *   <h3>Especificaciones</h3>
 *   <table><tbody><tr><th>Sistema</th><td>...</td></tr>...</tbody></table>
 * </section>
 * <section>
 *   <h3>Más información</h3>
 *   <p>Description paragraph 1</p>
 *   <p>Description paragraph 2</p>
 * </section>
 *
 * Generated: 2026-02-17 (updated 2026-02-22 for PDP support)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Pattern A: ws10 accordion items (tarifas page)
  const ws10Items = element.querySelectorAll('.ws10-c-accordion-list');
  if (ws10Items.length > 0) {
    ws10Items.forEach((item) => {
      const questionEl = item.querySelector('.ws10-c-accordion-list__title, h3, summary, [class*="title"]');
      const questionText = questionEl ? questionEl.textContent.trim() : '';
      if (!questionText) return;

      const answerEl = item.querySelector('[data-ws10-js="collapse"], .ws10-c-accordion-list__body, [class*="body"], [class*="content"]');

      const questionCell = document.createElement('div');
      questionCell.textContent = questionText;

      const answerCell = document.createElement('div');
      if (answerEl) {
        const clone = answerEl.cloneNode(true);
        const buttonsAndIcons = clone.querySelectorAll('button, svg, [class*="chevron"], [class*="icon"]');
        buttonsAndIcons.forEach((el) => el.remove());
        answerCell.innerHTML = clone.innerHTML;
      }

      cells.push([questionCell, answerCell]);
    });
  } else {
    // Pattern B: PDP-style h3 + content (specs table, description paragraphs)
    // Find h3 elements as accordion item titles
    const headings = element.querySelectorAll('h3');

    if (headings.length > 0) {
      headings.forEach((h3) => {
        const titleText = h3.textContent.trim();
        if (!titleText) return;

        const titleCell = document.createElement('div');
        titleCell.textContent = titleText;

        const contentCell = document.createElement('div');

        // Collect sibling content after h3 until next h3 or end
        let sibling = h3.nextElementSibling;
        while (sibling && sibling.tagName !== 'H3') {
          if (sibling.tagName === 'TABLE') {
            // Spec table: convert th/td rows to formatted text
            // Format: **Label:** value1 · value2 · value3
            const rows = sibling.querySelectorAll('tr');
            const specParts = [];
            rows.forEach((row) => {
              const th = row.querySelector('th');
              const td = row.querySelector('td');
              if (th && td) {
                const label = th.textContent.trim();
                const values = [];
                const paras = td.querySelectorAll('p');
                if (paras.length > 0) {
                  paras.forEach((p) => {
                    const val = p.textContent.trim();
                    if (val) values.push(val);
                  });
                } else {
                  values.push(td.textContent.trim());
                }
                specParts.push(`**${label}:** ${values.join(' · ')}`);
              }
            });
            // Join spec categories with <br>
            const specP = document.createElement('p');
            specP.innerHTML = specParts.join('<br>');
            contentCell.appendChild(specP);
          } else {
            // Clone paragraph/list content
            const clone = sibling.cloneNode(true);
            contentCell.appendChild(clone);
          }
          sibling = sibling.nextElementSibling;
        }

        cells.push([titleCell, contentCell]);
      });
    } else {
      // Fallback: treat li items as accordion items
      const items = element.querySelectorAll('li');
      items.forEach((item) => {
        const questionEl = item.querySelector('h3, summary, [class*="title"]');
        const questionText = questionEl ? questionEl.textContent.trim() : '';
        if (!questionText) return;

        const answerEl = item.querySelector('[class*="body"], [class*="content"]');
        const questionCell = document.createElement('div');
        questionCell.textContent = questionText;

        const answerCell = document.createElement('div');
        if (answerEl) {
          answerCell.innerHTML = answerEl.cloneNode(true).innerHTML;
        }

        cells.push([questionCell, answerCell]);
      });
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
  element.replaceWith(block);
}
