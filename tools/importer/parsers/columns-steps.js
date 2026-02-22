/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns (steps) block variant
 *
 * Source: https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/
 * Base Block: columns
 * Variant: steps
 *
 * Block Structure:
 * - Single row with 4 columns (one per step)
 * - Each column: icon image + step text
 * - Block name: "Columns (steps)"
 *
 * Source HTML Pattern (from cleaned.html):
 * <ol>
 *   <li><strong>Realiza tu pedido</strong></li>
 *   <li><strong>Recibirás tu SIM en 2-4 días</strong> y activaremos tu línea...</li>
 *   <li><strong>Accede a tu espacio personal en la app.</strong> Tu dispositivo...</li>
 *   <li><strong>Confirma la compra</strong> y recíbelo</li>
 * </ol>
 *
 * Generated: 2026-02-22
 */
export default function parse(element, { document }) {
  const cells = [];
  const row = [];

  // Find all step items
  // VALIDATED: cleaned.html has <li> items inside <ol> in the payment section
  const steps = element.querySelectorAll('li');

  // Icon mapping for steps (Vodafone PDP uses standard step icons)
  const iconUrls = [
    'https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg',
    'https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg',
    'https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg',
    'https://www.vodafone.es/c/tienda/tol/ftol/static/img/icons/ico_sim_red.svg',
  ];

  steps.forEach((step, index) => {
    const stepCell = document.createElement('div');

    // Add icon image
    if (iconUrls[index]) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = iconUrls[index];
      img.alt = step.textContent.trim().split('.')[0];
      picture.appendChild(img);
      stepCell.appendChild(picture);
    }

    // Add step text content (preserving bold text)
    const p = document.createElement('p');
    p.innerHTML = step.innerHTML;
    stepCell.appendChild(p);

    row.push(stepCell);
  });

  if (row.length > 0) {
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (steps)', cells });
  element.replaceWith(block);
}
