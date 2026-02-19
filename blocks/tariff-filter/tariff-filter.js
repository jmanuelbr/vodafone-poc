export default function decorate(block) {
  const tabs = [];
  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const label = cols[0]?.textContent.trim();
    const isActive = cols[1]?.textContent.trim() === 'active';
    tabs.push({ label, isActive });
  });

  block.textContent = '';

  // Create pill buttons
  const bar = document.createElement('div');
  bar.className = 'tariff-filter-bar';

  tabs.forEach((tab, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tariff-filter-btn';
    if (tab.isActive || (!tabs.some((t) => t.isActive) && idx === 0)) {
      btn.classList.add('active');
    }
    btn.textContent = tab.label;
    btn.setAttribute('data-filter', idx === 0 ? 'movil' : 'fibra');
    bar.append(btn);
  });

  block.append(bar);

  // Find the wrapper and scan siblings for movil/fibra blocks
  const wrapper = block.closest('.tariff-filter-wrapper');
  if (!wrapper) return;

  const section = wrapper.closest('.section');
  if (!section) return;

  // Scan all siblings after the tariff-filter wrapper
  let next = wrapper.nextElementSibling;
  while (next) {
    // Stop at section boundaries
    if (next.classList.contains('accordion-wrapper')) break;
    const heading = next.querySelector('h2');
    if (heading && /Somos transparentes|Llévatelo/.test(heading.textContent)) break;

    // Check for blocks with movil or fibra class
    const innerBlock = next.querySelector('.movil, .fibra');
    if (innerBlock) {
      if (innerBlock.classList.contains('movil')) {
        next.classList.add('tariff-group-movil');
      }
      if (innerBlock.classList.contains('fibra')) {
        next.classList.add('tariff-group-fibra');
        next.style.display = 'none'; // Hide fibra by default
      }
    }
    next = next.nextElementSibling;
  }

  // Tab click handling
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.tariff-filter-btn');
    if (!btn) return;
    const filter = btn.getAttribute('data-filter');

    bar.querySelectorAll('.tariff-filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    section.querySelectorAll('.tariff-group-movil, .tariff-group-fibra').forEach((el) => {
      if (el.classList.contains(`tariff-group-${filter}`)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  });
}
