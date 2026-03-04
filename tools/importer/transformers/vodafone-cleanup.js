/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for Vodafone Spain website cleanup
 * Purpose: Remove non-content elements, tracking attributes, and UI controls
 * Applies to: www.vodafone.es (all templates)
 * Generated: 2026-02-11
 *
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration workflow (cleaned.html)
 * - Class names verified: ws10-m-with-breadcrumb, ws10-c-carousel__animation-menu,
 *   ws10-c-carousel__bullets, ws10-c-carousel__play
 * - Data attributes verified: data-analytics-*, data-sq-*, data-vfes-seo-empathy-*,
 *   data-config, data-initialized
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove site chrome: header, footer, navigation
    // Live DOM uses header.vfh-header and footer.vfh-footer
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '.MDDfooter',
    ]);

    // Remove cookie consent, modals, spinners
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#icSpinner',
      '#icModal',
      '.x-root-container',
    ]);

    // Remove all script elements and config/analytics containers
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'link',
      'noscript',
      'iframe',
      '.tol-config',
      '.tol-literals',
      '.tol-modules',
      '.tol-parametros_config',
      '.tol-parametros_analitica',
    ]);

    // Remove SVG sprite containers (inline SVGs injected by framework)
    const svgContainers = element.querySelectorAll('div > svg:only-child');
    svgContainers.forEach((svg) => {
      const parent = svg.parentElement;
      if (parent && !parent.closest('#fichaTol') && parent.children.length === 1) {
        parent.remove();
      }
    });

    // Remove breadcrumb navigation (multiple selector patterns)
    WebImporter.DOMUtils.remove(element, [
      '.ws10-m-with-breadcrumb',
      'nav[aria-label="breadcrumb"]',
      'nav[aria-label="Navegación"]',
      'ftol-ficha-breadcrumbs',
      'mva10-c-breadcrumbs',
    ]);

    // Remove PDP non-content elements
    WebImporter.DOMUtils.remove(element, [
      '.usp-bar',
      '.product-benefits',
      '.order-summary',
      'ftol-ficha-legal-conditions',
    ]);

    // Remove carousel UI controls
    WebImporter.DOMUtils.remove(element, [
      '.ws10-c-carousel__animation-menu',
      '.ws10-c-carousel__bullets',
      '.ws10-c-carousel__play',
    ]);

    // Remove tracking pixels and beacon containers
    element.querySelectorAll('[id^="batBeacon"]').forEach((el) => el.remove());
    element.querySelectorAll('img[src*="pixel"], img[src*="beacon"], img[src*="tracking"]').forEach((el) => el.remove());
  }

  if (hookName === TransformHook.afterTransform) {
    // Clean up tracking and analytics data attributes
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      // Remove Vodafone analytics tracking attributes
      el.removeAttribute('data-analytics-category');
      el.removeAttribute('data-analytics-context');
      el.removeAttribute('data-analytics-element');
      el.removeAttribute('data-analytics-id');
      el.removeAttribute('data-analytics-link');
      el.removeAttribute('data-analytics-product');

      // Remove third-party integration attributes
      el.removeAttribute('data-sq-get');
      el.removeAttribute('data-sq-mod');
      el.removeAttribute('data-vfes-seo-empathy-offer-details');
      el.removeAttribute('data-vfes-seo-empathy-price');
      el.removeAttribute('data-vfes-seo-empathy-promoperiod');
      el.removeAttribute('data-vfes-seo-empathy-promoprice');

      // Remove framework initialization attributes
      el.removeAttribute('data-config');
      el.removeAttribute('data-initialized');
    });

    // Final cleanup of any remaining non-content elements
    WebImporter.DOMUtils.remove(element, [
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
