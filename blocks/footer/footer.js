import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment?.firstElementChild) return;

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Remove button classes from all links in footer
  footer.querySelectorAll('.button').forEach((button) => {
    button.className = '';
    const buttonContainer = button.closest('.button-container');
    if (buttonContainer) buttonContainer.className = '';
  });

  // Group h3 + ul pairs into columns for grid layout (second section)
  const sections = footer.querySelectorAll('.section');
  const linkSection = sections[1];
  if (linkSection) {
    const wrapper = linkSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      const columns = document.createElement('div');
      columns.className = 'footer-columns';
      const headings = wrapper.querySelectorAll('h3');
      headings.forEach((h3) => {
        const col = document.createElement('div');
        col.className = 'footer-column';
        const ul = h3.nextElementSibling;
        col.append(h3);
        if (ul && ul.tagName === 'UL') col.append(ul);
        columns.append(col);
      });
      wrapper.textContent = '';
      wrapper.append(columns);
    }
  }

  // Add accordion behavior for h3 + ul pairs on mobile
  footer.querySelectorAll('.footer-column h3').forEach((heading) => {
    heading.addEventListener('click', () => {
      if (window.innerWidth >= 900) return;
      heading.classList.toggle('open');
      const list = heading.nextElementSibling;
      if (list && list.tagName === 'UL') {
        list.classList.toggle('open');
      }
    });
  });

  block.append(footer);
}
