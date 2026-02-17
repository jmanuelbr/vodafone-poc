import { createOptimizedPicture } from '../../scripts/aem.js';

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
      const featureList = body.querySelector(':scope > ul');
      if (featureList) {
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

        // Create price box wrapper for badge + price + subtext
        const priceBox = document.createElement('div');
        priceBox.className = 'cards-pricing-price-box';

        // Move all elements before the feature list into the price box
        while (body.firstChild && body.firstChild !== featureList) {
          const child = body.firstChild;
          // Skip empty paragraphs
          if (child.nodeType === 1 && child.tagName === 'P'
            && !child.textContent.trim() && !child.querySelector('img')) {
            child.remove();
          } else {
            priceBox.append(child);
          }
        }

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
