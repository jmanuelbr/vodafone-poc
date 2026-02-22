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
    // Remove breadcrumb navigation (not authorable content)
    // EXTRACTED: Found class="ws10-m-with-breadcrumb" in captured DOM (homepage/tarifas)
    // EXTRACTED: Found nav[aria-label="breadcrumb"] in PDP captured DOM
    WebImporter.DOMUtils.remove(element, [
      '.ws10-m-with-breadcrumb',
      'nav[aria-label="breadcrumb"]',
    ]);

    // Remove PDP-specific non-content elements (found in PDP captured DOM)
    // EXTRACTED: Found ul.usp-bar in PDP cleaned.html
    // EXTRACTED: Found .product-benefits in PDP cleaned.html (USP bar: Pago a plazos, Trae tu móvil, etc.)
    // EXTRACTED: Found .order-summary in PDP cleaned.html (dynamic order summary section)
    // EXTRACTED: Found nav[aria-label="Navegación"] in PDP cleaned.html (breadcrumb)
    WebImporter.DOMUtils.remove(element, [
      '.usp-bar',
      '.product-benefits',
      '.order-summary',
      'nav[aria-label="Navegación"]',
    ]);

    // Remove carousel UI controls (navigation dots, play button, animation menu)
    // These are JavaScript-generated UI elements, not content
    // EXTRACTED: Found ws10-c-carousel__animation-menu, __bullets, __play in captured DOM
    WebImporter.DOMUtils.remove(element, [
      '.ws10-c-carousel__animation-menu',
      '.ws10-c-carousel__bullets',
      '.ws10-c-carousel__play',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Clean up tracking and analytics data attributes
    // EXTRACTED: Found data-analytics-*, data-sq-*, data-vfes-seo-empathy-* in captured DOM
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

    // Remove any remaining non-content elements
    WebImporter.DOMUtils.remove(element, [
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
