/**
 * Metadata block - processed by aem.js pipeline.
 * This file prevents 404 errors from block auto-loading.
 */
export default function decorate(block) {
  // Metadata is handled by the EDS pipeline in aem.js
  // This block is hidden via metadata.css
  block.closest('.section').remove();
}
