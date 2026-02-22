/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

// eslint-disable-next-line import/no-cycle
import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Loads a fragment.
 * Uses code base path when set (e.g. on EDS with path prefix like /c/tienda-online/autonomos)
 * so that /nav and /footer resolve to the same origin path as the page.
 * @param {string} path The path to the fragment (e.g. /nav or /footer)
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    const codeBasePath = (window.hlx && window.hlx.codeBasePath) ? window.hlx.codeBasePath.replace(/\/$/, '') : '';
    const fragmentPath = codeBasePath ? `${codeBasePath}${path}` : path;
    const fragmentUrl = `${fragmentPath}.plain.html`;
    const resp = await fetch(fragmentUrl);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const fragmentBaseUrl = new URL(fragmentPath, window.location.origin);
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), fragmentBaseUrl).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) block.replaceChildren(...fragment.childNodes);
}
