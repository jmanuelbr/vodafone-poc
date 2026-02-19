import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Split a single paragraph with double-BR separators into multiple paragraphs.
 * PDP card content arrives as one <p> with <br><br> between logical groups.
 */
function splitBrParagraph(body) {
  const singleP = body.querySelector(':scope > p:only-child');
  if (!singleP || !singleP.querySelector('br')) return;

  const groups = [];
  let current = [];
  const nodes = [...singleP.childNodes];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    // Detect BR + optional whitespace + BR (double-BR separator)
    if (node.nodeName === 'BR') {
      let j = i + 1;
      while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
      if (j < nodes.length && nodes[j].nodeName === 'BR') {
        if (current.length > 0) {
          groups.push(current);
          current = [];
        }
        i = j + 1;
        continue;
      }
    }

    // Skip leading whitespace in each group
    if (node.nodeType === 3 && !node.textContent.trim() && current.length === 0) {
      i += 1;
      continue;
    }

    current.push(node);
    i += 1;
  }
  if (current.length > 0) groups.push(current);
  if (groups.length <= 1) return;

  singleP.remove();
  groups.forEach((group) => {
    const p = document.createElement('p');
    group.forEach((n) => p.appendChild(n));
    body.appendChild(p);
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture') || div.children.length === 0) div.className = 'cards-pricing-card-image';
      else div.className = 'cards-pricing-card-body';
    });

    const body = li.querySelector('.cards-pricing-card-body');
    if (body) {
      // Pre-process: split single BR-separated paragraph into multiple paragraphs
      splitBrParagraph(body);

      // Check first paragraph for highlight badge ("La más vendida")
      const firstP = body.querySelector(':scope > p:first-child');
      if (firstP) {
        const strong = firstP.querySelector('strong');
        if (strong && /más vendida/i.test(strong.textContent)) {
          li.classList.add('highlighted');
          const tab = document.createElement('div');
          tab.className = 'cards-pricing-highlight-tab';
          tab.textContent = strong.textContent.trim();
          li.prepend(tab);
          firstP.remove();
        }
      }

      const featureList = body.querySelector(':scope > ul');
      // Find CTA paragraph (contains links)
      const ctaParagraph = [...body.querySelectorAll(':scope > p')].find(
        (p) => p.querySelector('a'),
      );

      // Determine boundary element for price box
      const boundary = featureList || ctaParagraph;

      if (boundary) {
        // Create price box wrapper for badge + price + subtext + features
        const priceBox = document.createElement('div');
        priceBox.className = 'cards-pricing-price-box';

        // Move all elements before the boundary into the price box
        while (body.firstChild && body.firstChild !== boundary) {
          const child = body.firstChild;
          // Skip empty paragraphs
          if (child.nodeType === 1 && child.tagName === 'P'
            && !child.textContent.trim() && !child.querySelector('img')) {
            child.remove();
          } else {
            priceBox.append(child);
          }
        }

        // Classify price box paragraphs for styling
        [...priceBox.querySelectorAll(':scope > p')].forEach((p, idx) => {
          const text = p.textContent.trim();
          if (/€\/mes/.test(text)) {
            p.classList.add('cards-pricing-amount');
          } else if (text.startsWith('-')) {
            p.classList.add('cards-pricing-features');
          } else if (idx === 0 && p.querySelector('strong')) {
            p.classList.add('cards-pricing-badge');
          }
        });

        if (priceBox.children.length > 0) {
          body.prepend(priceBox);
        }
      }
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
