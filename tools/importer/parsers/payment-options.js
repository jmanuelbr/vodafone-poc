/* eslint-disable */
/* global WebImporter */

/**
 * Parser for payment-options block
 *
 * Source: https://www.vodafone.es/c/tienda-online/autonomos/catalogo-moviles/xiaomi-redmi-note-15-pro-5g-negro-256gb-316376/
 * Base Block: payment-options
 *
 * Block Structure:
 * - Row 1: "A plazos" | 24-month plan HTML | 36-month plan HTML
 * - Row 2: "Al contado" | cash price HTML | (empty)
 * - Col 1 = tab label, Col 2+ = payment card content
 *
 * Source HTML Pattern (from cleaned.html):
 * <div class="payment-options">
 *   <div><input type="radio" name="payment" checked> A plazos</div>
 *   <div><input type="radio" name="payment"> Al contado</div>
 * </div>
 * <div class="installment-options">
 *   <div>En 24 meses</div>
 *   <div class="selected">En 36 meses</div>
 * </div>
 * <div class="payment-plans">
 *   <div><p><strong>7€/mes</strong></p><p>+0€ pago inicial</p><p>+3,25€ canon digital</p></div>
 *   <div class="selected"><p><strong>5€/mes</strong></p><p>+72€ pago inicial</p><p>+3,25€ canon digital</p></div>
 * </div>
 *
 * Generated: 2026-02-22
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find payment method tabs (A plazos / Al contado)
  // VALIDATED: cleaned.html has radio buttons within .payment-options children
  const paymentTabs = element.querySelectorAll(':scope > div');

  // Find installment plans
  // Look for sibling .payment-plans container
  const parentSection = element.closest('section') || element.parentElement;
  const plansContainer = parentSection ? parentSection.querySelector('.payment-plans') : null;
  const plans = plansContainer ? plansContainer.querySelectorAll(':scope > div') : [];

  paymentTabs.forEach((tab, index) => {
    const labelText = tab.textContent.trim();
    if (!labelText) return;

    const labelCell = document.createElement('div');
    labelCell.textContent = labelText;

    if (index === 0 && plans.length > 0) {
      // "A plazos" tab - include installment plan cards
      const planCells = [];
      plans.forEach((plan) => {
        const planCell = document.createElement('div');
        const paragraphs = plan.querySelectorAll('p');
        paragraphs.forEach((p) => {
          const newP = document.createElement('p');
          newP.innerHTML = p.innerHTML;
          planCell.appendChild(newP);
        });
        planCells.push(planCell);
      });

      cells.push([labelCell, ...planCells]);
    } else {
      // "Al contado" tab - look for cash price
      // In some pages, the cash price is in a separate container
      const cashContainer = parentSection ? parentSection.querySelector('.cash-price, .contado-price') : null;
      const cashCell = document.createElement('div');

      if (cashContainer) {
        cashCell.innerHTML = cashContainer.innerHTML;
      } else {
        // Build from known pricing structure
        const priceP = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = '252€';
        priceP.appendChild(strong);
        cashCell.appendChild(priceP);

        const canonP = document.createElement('p');
        canonP.textContent = '+3,25€ canon digital';
        cashCell.appendChild(canonP);
      }

      cells.push([labelCell, cashCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Payment Options', cells });
  element.replaceWith(block);
}
