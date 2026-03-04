/**
 * Metadata block - processed by aem.js pipeline.
 * Applies metadata to page head, then removes itself.
 */
export default function decorate(block) {
  const section = block.closest('.section');
  const wrapper = block.parentElement;

  // Remove the metadata wrapper
  if (wrapper) {
    wrapper.remove();
  }

  // If the section is now empty, remove it too
  if (section && section.children.length === 0) {
    section.remove();
  }
}
