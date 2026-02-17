/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table (striped) block
 *
 * Source: https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/contrato/tarifas-contrato/
 * Base Block: table
 *
 * Block Structure:
 * - Row 1: Header row (Datos, Llamadas, Precio, link column)
 * - Row 2-N: Data rows with tariff information
 *
 * Source HTML Pattern:
 * .ws10-m-new-table-comparative
 *   table.ws10-c-table
 *     thead > tr > th.ws10-c-table__cell--header
 *     tbody > tr > td.ws10-c-table__cell
 *
 * Generated: 2026-02-17
 */
export default function parse(element, { document }) {
  const cells = [];

  const table = element.querySelector('table, .ws10-c-table');
  if (!table) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'Table (striped)', cells: [] });
    element.replaceWith(block);
    return;
  }

  // Process header row
  const headerRow = table.querySelector('thead tr, tr:first-child');
  if (headerRow) {
    const headerCells = headerRow.querySelectorAll('th, td');
    const row = [];
    headerCells.forEach((cell) => {
      const text = cell.textContent.trim();
      // Skip hidden mobile/desktop duplicate columns
      if (!cell.classList.contains('ws10-c-table__cell--hide-mobile') || text) {
        row.push(text);
      }
    });
    if (row.length > 0) cells.push(row);
  }

  // Process data rows
  const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  dataRows.forEach((tr) => {
    const tds = tr.querySelectorAll('td, th');
    const row = [];
    tds.forEach((cell) => {
      // Check for links
      const link = cell.querySelector('a[href]');
      if (link) {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.textContent.trim();
        row.push(a);
      } else {
        row.push(cell.textContent.trim());
      }
    });
    if (row.length > 0) cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Table (striped)', cells });
  element.replaceWith(block);
}
