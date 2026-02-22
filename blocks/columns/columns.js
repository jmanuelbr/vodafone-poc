export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Steps variant: restructure icon+text and add timeline dots
  if (block.classList.contains('steps')) {
    [...block.children].forEach((row) => {
      [...row.children].forEach((col) => {
        // Extract icon from <p> and make it a direct child for flex layout
        const p = col.querySelector('p');
        const icon = p?.querySelector('.icon');
        if (icon && p) {
          // Remove icon and following <br> from paragraph
          const br = icon.nextElementSibling?.tagName === 'BR' ? icon.nextElementSibling : null;
          icon.remove();
          if (br) br.remove();
          // Also remove leading <br> if present
          if (p.firstChild?.nodeName === 'BR') p.firstChild.remove();

          // Create text wrapper for remaining paragraph content
          const textWrap = document.createElement('div');
          textWrap.className = 'steps-text';
          textWrap.append(p);

          // Re-insert icon first, then text wrapper
          col.prepend(textWrap);
          col.prepend(icon);
        }

        const dot = document.createElement('div');
        dot.className = 'steps-dot';
        col.append(dot);
      });
    });
  }
}
