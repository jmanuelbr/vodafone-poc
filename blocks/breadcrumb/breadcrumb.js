export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ul = document.createElement('ul');

  const items = [...block.querySelectorAll('li')];
  items.forEach((item, index) => {
    const li = document.createElement('li');
    const link = item.querySelector('a');

    if (link && index < items.length - 1) {
      li.appendChild(link);
    } else {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'page');
      span.textContent = item.textContent.trim();
      li.appendChild(span);
    }

    ul.appendChild(li);
  });

  nav.appendChild(ul);
  block.textContent = '';
  block.appendChild(nav);
}
