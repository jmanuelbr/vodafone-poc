/* eslint-disable */
/* global WebImporter */

/**
 * Parser for customer-tabs block
 *
 * Source: https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/
 * Base Block: customer-tabs
 *
 * Block Structure:
 * - 2 columns per row
 * - Col 1: Tab label text
 * - Col 2: "active" for default tab, or content/link for other tabs
 *
 * Source HTML Pattern (from cleaned.html):
 * <div class="tariff-tabs">
 *   <button>No soy cliente</button>
 *   <button>Ya soy cliente</button>
 * </div>
 *
 * Note: In real Vodafone DOM, the second tab may contain
 * a link to Mi Vodafone client area.
 *
 * Generated: 2026-02-22
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find tab buttons/elements
  // VALIDATED: cleaned.html has <button> elements inside .tariff-tabs
  const tabs = element.querySelectorAll('button, [role="tab"], a[class*="tab"]');

  tabs.forEach((tab, index) => {
    const label = tab.textContent.trim();
    if (!label) return;

    const labelCell = document.createElement('div');
    labelCell.textContent = label;

    const contentCell = document.createElement('div');

    if (index === 0) {
      // First tab is active by default
      contentCell.textContent = 'active';
    } else {
      // Second tab: check for links (client area redirect)
      const link = tab.querySelector('a') || tab.closest('a');
      if (link && link.href) {
        const p = document.createElement('p');
        p.textContent = 'Accede a tu área de cliente para ver tus ofertas exclusivas ';
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = 'Mi Vodafone';
        p.appendChild(a);
        contentCell.appendChild(p);
      } else {
        // Fallback: include redirect text for Ya soy cliente tab
        const p = document.createElement('p');
        p.textContent = 'Accede a tu área de cliente para ver tus ofertas exclusivas ';
        const a = document.createElement('a');
        a.href = 'https://www.vodafone.es/c/mi-vodafone/';
        a.textContent = 'Mi Vodafone';
        p.appendChild(a);
        contentCell.appendChild(p);
      }
    }

    cells.push([labelCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Customer Tabs', cells });
  element.replaceWith(block);
}
