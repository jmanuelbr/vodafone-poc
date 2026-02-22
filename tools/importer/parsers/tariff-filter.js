/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tariff-filter block
 *
 * Source: https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/
 * Base Block: tariff-filter
 *
 * Block Structure:
 * - 2 columns per row
 * - Col 1: Filter label text
 * - Col 2: "active" if selected, empty if not
 *
 * Source HTML Pattern (from cleaned.html):
 * <div class="tariff-types">
 *   <label><input type="checkbox" checked> Tarifas Móvil</label>
 *   <label><input type="checkbox"> Tarifas Fibra y Móvil</label>
 * </div>
 *
 * Generated: 2026-02-22
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find filter items (labels with checkboxes/radios, or buttons)
  // VALIDATED: cleaned.html has <label> elements with <input type="checkbox"> inside .tariff-types
  const labels = element.querySelectorAll('label, [role="tab"], button');

  labels.forEach((label) => {
    const text = label.textContent.trim();
    if (!text) return;

    const labelCell = document.createElement('div');
    labelCell.textContent = text;

    const stateCell = document.createElement('div');

    // Check if this filter is active/checked
    const input = label.querySelector('input');
    const isActive = (input && input.checked)
      || label.classList.contains('active')
      || label.classList.contains('selected')
      || label.getAttribute('aria-selected') === 'true';

    if (isActive) {
      stateCell.textContent = 'active';
    }

    cells.push([labelCell, stateCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Tariff Filter', cells });
  element.replaceWith(block);
}
