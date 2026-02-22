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
 * Returns same-origin candidate base paths (code base, then pathname prefixes).
 */
function getSameOriginBaseCandidates() {
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
 * Returns the content source base URL when running on EDS (e.g. *.aem.page).
 * Derived from hostname main--vodafone-poc--jmanuelbr.aem.page -> https://content.da.live/jmanuelbr/vodafone-poc
 * or from meta name="content-source" if set.
 */
function getContentSourceBaseUrl() {
  const meta = document.querySelector('meta[name="content-source"]');
  if (meta?.content) return meta.content.replace(/\/$/, '');
  const host = window.location.hostname;
  if (!host.endsWith('.aem.page')) return null;
  const parts = host.split('--');
  if (parts.length < 3) return null;
  const owner = parts[parts.length - 1].replace(/\.aem\.page$/i, '');
  const repo = parts[parts.length - 2];
  return `https://content.da.live/${owner}/${repo}`;
}

/**
 * Returns raw GitHub base URL for the repo (branch from hostname, e.g. main).
 * Used when content.da.live returns 401; raw GitHub is public.
 */
function getGitHubContentBaseUrl() {
  const host = window.location.hostname;
  if (!host.endsWith('.aem.page')) return null;
  const parts = host.split('--');
  if (parts.length < 3) return null;
  const ref = parts[0] || 'main';
  const repo = parts[parts.length - 2];
  const owner = parts[parts.length - 1].replace(/\.aem\.page$/i, '');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}`;
}

/**
 * Loads a fragment: tries same-origin paths first, then content source (content.da.live).
 * EDS preview often does not serve nav/footer from the page origin; they exist at the content source.
 * @param {string} path The path to the fragment (e.g. /nav or /footer)
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;

  const plainUrl = `${path}.plain.html`;

  const tryFetch = (baseUrl, isSameOrigin) => {
    const url = isSameOrigin
      ? (baseUrl ? `${baseUrl}${plainUrl}` : plainUrl)
      : `${baseUrl}${path}.plain.html`;
    return fetch(url);
  };

  const processResponse = async (resp, fragmentPath, contentBaseUrl) => {
    if (!resp.ok) return null;
    const main = document.createElement('main');
    main.innerHTML = await resp.text();
    const fragmentBaseUrl = contentBaseUrl
      ? new URL((fragmentPath.startsWith('/') ? fragmentPath.slice(1) : fragmentPath) || '.', `${contentBaseUrl.replace(/\/$/, '')}/`)
      : new URL(fragmentPath, window.location.origin);
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
  };

  const pathNoLead = path.replace(/^\//, '');
  const plainName = `${pathNoLead}.plain.html`;
  const isEDS = window.location.hostname.endsWith('.aem.page');

  const tryRemoteBase = (baseUrl) => {
    if (!baseUrl) return null;
    const url = `${baseUrl.replace(/\/$/, '')}/${plainName}`;
    return fetch(url).then((r) => (r.ok ? { resp: r, base: baseUrl } : null));
  };

  // 1) Use cached base if we already found one that works (avoids repeated failed requests)
  const cached = window.hlx?.fragmentBasePath;
  if (cached != null) {
    const url = cached.startsWith('http') ? `${cached.replace(/\/$/, '')}/${plainName}` : (cached ? `${cached}${plainUrl}` : plainUrl);
    const resp = await fetch(url);
    if (resp.ok) {
      const fragmentPath = cached.startsWith('http') ? path : (cached ? `${cached}${path}` : path);
      return processResponse(resp, fragmentPath, cached.startsWith('http') ? cached : null);
    }
  }

  // 2) On EDS: only raw GitHub (e.g. raw.githubusercontent.com/owner/repo/main) – no other fallbacks
  if (isEDS) {
    const gh = getGitHubContentBaseUrl();
    const result = gh ? await tryRemoteBase(gh) : null;
    if (result) {
      if (window.hlx) window.hlx.fragmentBasePath = gh;
      return processResponse(result.resp, path, gh);
    }
    return null;
  }

  // 3) Local / non-EDS: same-origin path candidates, then content source, then raw GitHub
  const sameOriginBases = getSameOriginBaseCandidates();
  for (const base of sameOriginBases) {
    const fragmentPath = base ? `${base}${path}` : path;
    const resp = await tryFetch(base, true);
    if (resp.ok) {
      if (window.hlx) window.hlx.fragmentBasePath = base;
      return processResponse(resp, fragmentPath, null);
    }
  }
  const contentBase = getContentSourceBaseUrl();
  if (contentBase) {
    const resp = await tryRemoteBase(contentBase);
    if (resp) {
      if (window.hlx) window.hlx.fragmentBasePath = contentBase;
      return processResponse(resp.resp, path, contentBase);
    }
  }
  const gh = getGitHubContentBaseUrl();
  if (gh) {
    const result = await tryRemoteBase(gh);
    if (result) {
      if (window.hlx) window.hlx.fragmentBasePath = gh;
      return processResponse(result.resp, path, gh);
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
