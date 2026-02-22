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
 * Returns candidate base paths for fragment URLs (root first, then pathname prefixes).
 * On EDS, scripts may be served from domain root so codeBasePath is empty; fragments
 * can live under the page path (e.g. /c/tienda-online/autonomos/nav.plain.html).
 */
function getFragmentBaseCandidates() {
  const candidates = [];
  if (window.hlx && window.hlx.codeBasePath) {
    candidates.push(window.hlx.codeBasePath.replace(/\/$/, ''));
  }
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  let prefix = '';
  for (const seg of segments) {
    prefix += `/${seg}`;
    if (!candidates.includes(prefix)) candidates.push(prefix);
  }
  if (!candidates.includes('')) candidates.push('');
  return candidates;
}

/**
 * Loads a fragment.
 * Tries the code base path first, then pathname prefixes (for EDS where nav/footer
 * live under e.g. /c/tienda-online/autonomos/ so they work for every da.live page).
 * @param {string} path The path to the fragment (e.g. /nav or /footer)
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;

  const plainUrl = `${path}.plain.html`;
  const bases = window.hlx?.fragmentBasePath != null
    ? [window.hlx.fragmentBasePath]
    : getFragmentBaseCandidates();

  for (const base of bases) {
    const fragmentPath = base ? `${base}${path}` : path;
    const fragmentUrl = base ? `${base}${plainUrl}` : plainUrl;
    const resp = await fetch(fragmentUrl);
    if (resp.ok) {
      if (window.hlx) window.hlx.fragmentBasePath = base;
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

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
