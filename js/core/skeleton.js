/* ============================================
   HELPIUM - Skeleton Loading
   ============================================ */

const SkeletonLoader = (() => {
  function show(targetSelector, options = {}) {
    const targets = document.querySelectorAll(targetSelector);
    if (!targets.length) return;

    const { rows = 3, columns = 6, minHeight = 90 } = options;

    targets.forEach(target => {
      const tag = target.tagName;
      const isTable = tag === 'TABLE' || tag === 'TBODY';

      if (isTable) {
        // Operate on the tbody
        const body = tag === 'TABLE' ? target.querySelector('tbody') : target;
        if (!body) return;
        body.innerHTML = '';

        const cells = columns < 1 ? 1 : columns;
        const cellWidths = [45, 80, 35, 40, 25, 60];
        const rowsHtml = Array.from({ length: rows }, () => {
          const tds = Array.from({ length: cells }, (_, i) => {
            const w = (cellWidths[i % cellWidths.length] + ((i * 7) % 15));
            return `<td><div class="skeleton skeleton-text" style="width:${w}%"></div></td>`;
          }).join('');
          return `<tr aria-hidden="true">${tds}</tr>`;
        }).join('');

        body.innerHTML = rowsHtml;
      } else {
        target.innerHTML = '';
        target.style.minHeight = minHeight + 'px';
        target.innerHTML = Array.from({ length: rows }, () =>
          `<div class="skeleton-card skeleton" style="margin-bottom:12px"></div>`
        ).join('');
      }
    });
  }

  function hide(targetSelector) {
    const targets = document.querySelectorAll(targetSelector);
    targets.forEach(target => {
      target.style.minHeight = '';
    });
  }

  function showList(targetSelector, items = 3) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    target.innerHTML = '';
    const html = Array.from({ length: items }, () => `
      <div style="padding:12px 0;border-bottom:1px solid var(--line)">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text" style="width:85%"></div>
      </div>
    `).join('');
    target.innerHTML = html;
  }

  return { show, hide, showList };
})();