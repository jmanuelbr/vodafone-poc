#!/usr/bin/env node
/**
 * Bulk Image Downloader & HTML Reference Updater
 *
 * Downloads all external Vodafone images referenced in .plain.html files
 * and updates HTML to use local relative paths.
 *
 * Target structure (matching OPPO Reno 14 FS reference page):
 *   /content/images/products/{product-slug}/{view}.png
 *   /content/images/promos/{slug}.{ext}
 *   /content/images/metadata/{product-slug}.png
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import https from 'node:https';
import http from 'node:http';

const CONTENT_DIR = '/workspace/content/c/tienda-online/autonomos/catalogo-moviles';
const IMAGES_BASE = '/workspace/content/images';

// Map of Vodafone image URL slug patterns to local view names
const VIEW_MAP = {
  'frontal': 'frontal',
  'zoom-frontal': 'frontal',
  'trasera': 'trasera',
  'zoom-trasera': 'trasera',
  'lateral': 'lateral',
  'zoom-lateral': 'lateral',
  'canto': 'canto',
  'zoom-canto': 'canto',
  'zoom-multiple': 'multiple',
  'zoom-contenido': 'contenido-caja',
  'contenido-caja': 'contenido-caja',
};

/**
 * Download a file from a URL, following redirects
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        downloadFile(redirectUrl).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Detect file extension from buffer magic bytes
 */
function detectExtension(buffer) {
  if (buffer.length < 4) return 'bin';
  const hex = buffer.subarray(0, 8).toString('hex');
  if (hex.startsWith('89504e47')) return 'png';
  if (hex.startsWith('ffd8ff')) return 'jpg';
  if (hex.startsWith('47494638')) return 'gif';
  if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  // Check for SVG (text-based)
  const text = buffer.subarray(0, 200).toString('utf8');
  if (text.includes('<svg') || text.includes('<?xml')) return 'svg';
  return 'png'; // default to png
}

/**
 * Extract product slug from the plain.html filename
 */
function getProductSlug(filename) {
  return filename.replace('.plain.html', '');
}

/**
 * Determine view name from Vodafone URL slug
 */
function getViewName(urlSlug) {
  const lower = urlSlug.toLowerCase();
  for (const [pattern, viewName] of Object.entries(VIEW_MAP)) {
    if (lower.startsWith(pattern)) return viewName;
  }
  // Fallback: use the slug itself, cleaned up
  return lower.replace(/[^a-z0-9-]/g, '');
}

/**
 * Parse a Vodafone image URL and determine local path category
 */
function categorizeUrl(url, productSlug) {
  // Product gallery images: /c/tienda/tol/img/{id}/{slug}/
  const productMatch = url.match(/\/c\/tienda\/tol\/img\/(\d+)\/([^/?]+)/);
  if (productMatch) {
    const slug = productMatch[2];

    // Check if this is a product photo (has view-related slug)
    const isProductPhoto = /frontal|trasera|lateral|canto|multiple|contenido/i.test(slug);
    if (isProductPhoto) {
      const viewName = getViewName(slug);
      return {
        category: 'product',
        dir: join(IMAGES_BASE, 'products', productSlug),
        baseName: viewName,
        localPathPrefix: `/content/images/products/${productSlug}/${viewName}`,
      };
    }

    // Promo images
    return {
      category: 'promo',
      dir: join(IMAGES_BASE, 'promos'),
      baseName: slug,
      localPathPrefix: `/content/images/promos/${slug}`,
    };
  }

  // Charity-giving and similar: /c/tol/img/{id}/{slug}
  const charityMatch = url.match(/\/c\/tol\/img\/(\d+)\/([^/?]+)/);
  if (charityMatch) {
    const slug = charityMatch[2];
    return {
      category: 'promo',
      dir: join(IMAGES_BASE, 'promos'),
      baseName: slug,
      localPathPrefix: `/content/images/promos/${slug}`,
    };
  }

  // Static images: /c/tienda/tol/static/img/...
  const staticMatch = url.match(/\/static\/img\/.*?([^/]+)\.(\w+)$/);
  if (staticMatch) {
    const slug = staticMatch[1];
    const ext = staticMatch[2];
    return {
      category: 'promo',
      dir: join(IMAGES_BASE, 'promos'),
      baseName: slug,
      localPathPrefix: `/content/images/promos/${slug}`,
      knownExt: ext,
    };
  }

  return null;
}

/**
 * Extract all unique external image URLs from an HTML string
 */
function extractImageUrls(html) {
  const urls = new Set();
  // Match src="..." and srcset="..." attributes
  const regex = /(?:src|srcset)="(https:\/\/www\.vodafone\.es\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.add(match[1]);
  }
  return [...urls];
}

/**
 * Main processing
 */
async function main() {
  console.log('=== Bulk Image Download & HTML Reference Update ===\n');

  // 1. Find all .plain.html files
  const files = (await readdir(CONTENT_DIR))
    .filter((f) => f.endsWith('.plain.html'))
    .sort();

  console.log(`Found ${files.length} .plain.html files\n`);

  // 2. Build global URL-to-local-path mapping
  // Download tracking: url -> { localPath, downloaded }
  const urlMap = new Map(); // url -> localRelativePath (e.g., /content/images/products/slug/frontal.png)
  const downloadQueue = new Map(); // url -> { destDir, baseName, knownExt? }

  // First pass: extract all URLs and plan downloads
  for (const file of files) {
    const productSlug = getProductSlug(file);
    const html = await readFile(join(CONTENT_DIR, file), 'utf8');
    const urls = extractImageUrls(html);

    for (const url of urls) {
      if (urlMap.has(url)) continue; // Already planned

      const cat = categorizeUrl(url, productSlug);
      if (!cat) {
        console.log(`  ⚠ Unknown URL pattern: ${url}`);
        continue;
      }

      downloadQueue.set(url, {
        destDir: cat.dir,
        baseName: cat.baseName,
        knownExt: cat.knownExt || null,
        localPathPrefix: cat.localPathPrefix,
      });
    }
  }

  console.log(`Total unique images to download: ${downloadQueue.size}\n`);

  // 3. Download all images
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [url, info] of downloadQueue) {
    // Check if already downloaded with known extension
    const existingExts = ['png', 'jpg', 'svg', 'gif', 'webp'];
    let alreadyExists = false;
    for (const ext of existingExts) {
      const path = join(info.destDir, `${info.baseName}.${ext}`);
      if (existsSync(path)) {
        urlMap.set(url, `${info.localPathPrefix}.${ext}`);
        alreadyExists = true;
        skipped++;
        break;
      }
    }
    if (alreadyExists) continue;

    try {
      const buffer = await downloadFile(url);
      const ext = info.knownExt || detectExtension(buffer);
      const destPath = join(info.destDir, `${info.baseName}.${ext}`);

      await mkdir(info.destDir, { recursive: true });
      await writeFile(destPath, buffer);

      const localPath = `${info.localPathPrefix}.${ext}`;
      urlMap.set(url, localPath);
      downloaded++;

      if (downloaded % 20 === 0) {
        console.log(`  Downloaded ${downloaded}/${downloadQueue.size}...`);
      }
    } catch (err) {
      console.log(`  ✗ Failed: ${url} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDownload complete: ${downloaded} new, ${skipped} already existed, ${failed} failed\n`);

  // 4. Update HTML files
  let updatedFiles = 0;
  let unchangedFiles = 0;

  for (const file of files) {
    const filePath = join(CONTENT_DIR, file);
    const productSlug = getProductSlug(file);
    let html = await readFile(filePath, 'utf8');
    const originalHtml = html;

    // For each URL in the map, replace in this file
    // We need to re-categorize URLs per-file for product images since productSlug differs
    const fileUrls = extractImageUrls(html);

    for (const url of fileUrls) {
      // Check if this URL is in the global map
      if (urlMap.has(url)) {
        const localPath = urlMap.get(url);
        html = html.split(url).join(localPath);
        continue;
      }

      // URL might be a product image for THIS file's product slug
      const cat = categorizeUrl(url, productSlug);
      if (cat) {
        // Check if we downloaded it under a different product slug earlier
        // Try to find the local file
        const existingExts = ['png', 'jpg', 'svg', 'gif', 'webp'];
        for (const ext of existingExts) {
          const path = join(cat.dir, `${cat.baseName}.${ext}`);
          if (existsSync(path)) {
            const localPath = `${cat.localPathPrefix}.${ext}`;
            html = html.split(url).join(localPath);
            break;
          }
        }
      }
    }

    // Also handle metadata Image references (img src without picture wrapper)
    // These are in the metadata block at the end
    const metaImgRegex = /<div>Image<\/div><div><img src="(https:\/\/www\.vodafone\.es\/[^"]+)"/g;
    let metaMatch;
    while ((metaMatch = metaImgRegex.exec(html)) !== null) {
      const metaUrl = metaMatch[1];
      // This metadata image is typically the frontal product image
      const cat = categorizeUrl(metaUrl, productSlug);
      if (cat) {
        const existingExts = ['png', 'jpg', 'svg', 'gif', 'webp'];
        for (const ext of existingExts) {
          const path = join(cat.dir, `${cat.baseName}.${ext}`);
          if (existsSync(path)) {
            const localPath = `${cat.localPathPrefix}.${ext}`;
            html = html.split(metaUrl).join(localPath);
            break;
          }
        }
      }
    }

    if (html !== originalHtml) {
      await writeFile(filePath, html);
      updatedFiles++;
    } else {
      unchangedFiles++;
    }
  }

  console.log(`HTML update complete: ${updatedFiles} files updated, ${unchangedFiles} unchanged\n`);

  // 5. Also update the full .html files (non-plain versions)
  const htmlFiles = (await readdir(CONTENT_DIR))
    .filter((f) => f.endsWith('.html') && !f.endsWith('.plain.html'))
    .sort();

  let updatedFullFiles = 0;

  for (const file of htmlFiles) {
    const filePath = join(CONTENT_DIR, file);
    const productSlug = file.replace('.html', '');
    let html = await readFile(filePath, 'utf8');
    const originalHtml = html;

    const fileUrls = extractImageUrls(html);

    for (const url of fileUrls) {
      if (urlMap.has(url)) {
        html = html.split(url).join(urlMap.get(url));
        continue;
      }

      const cat = categorizeUrl(url, productSlug);
      if (cat) {
        const existingExts = ['png', 'jpg', 'svg', 'gif', 'webp'];
        for (const ext of existingExts) {
          const path = join(cat.dir, `${cat.baseName}.${ext}`);
          if (existsSync(path)) {
            const localPath = `${cat.localPathPrefix}.${ext}`;
            html = html.split(url).join(localPath);
            break;
          }
        }
      }
    }

    if (html !== originalHtml) {
      await writeFile(filePath, html);
      updatedFullFiles++;
    }
  }

  console.log(`Full HTML update: ${updatedFullFiles} .html files updated\n`);

  // 6. Summary
  console.log('=== Summary ===');
  console.log(`Images downloaded: ${downloaded}`);
  console.log(`Images already existed: ${skipped}`);
  console.log(`Download failures: ${failed}`);
  console.log(`.plain.html files updated: ${updatedFiles}`);
  console.log(`.html files updated: ${updatedFullFiles}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
