// Lightweight print helpers that open a new window with clean markup
// and auto-trigger the browser's print dialog.

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; padding: 28px 32px; color: #111; margin: 0; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  h2 { margin: 18px 0 8px; font-size: 16px; }
  .muted { color: #666; font-size: 12px; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; }
  .right { text-align: right; }
  .total-row td { font-weight: 700; font-size: 14px; border-top: 2px solid #111; border-bottom: none; padding-top: 10px; }
  .meta { margin-top: 8px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 16px; font-size: 12px; }
  .meta b { color: #333; }
  .badge { display: inline-block; padding: 2px 8px; border: 1px solid #999; border-radius: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  @media print { body { padding: 0; } }
`;

function openPrintWindow(title, bodyHtml) {
  const w = window.open('', '_blank', 'width=860,height=1000');
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>${BASE_STYLES}</style></head><body>${bodyHtml}<script>window.onload=()=>{setTimeout(()=>{window.print();},250);};window.onafterprint=()=>window.close();</script></body></html>`);
  w.document.close();
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toFixed(2)}`;
}

export function printInvoice(order) {
  const items = order.items || [];
  const anyBreakdown = items.some((it) => it.fulfilledFromInventory != null || it.fulfilledFromSupply != null || it.freeQuantity);
  const lines = items.map((it) => {
    const qty = (it.fulfilledQuantity ?? it.quantity) || 0;
    const price = it.unitPrice || 0;
    const line = qty * price;
    const unit = it.product?.unit || '';
    const grade = it.qualityGrade?.clientFacingGrade || it.qualityGrade?.grade || '';
    const inv = it.fulfilledFromInventory;
    const sup = it.fulfilledFromSupply;
    const free = it.freeQuantity;
    const breakdownBits = [];
    if (inv != null && inv > 0) breakdownBits.push(`${inv} ${unit} inventory`);
    if (sup != null && sup > 0) breakdownBits.push(`${sup} ${unit} new supply`);
    if (free && free > 0) breakdownBits.push(`<b>+${free} ${unit} free</b>`);
    const breakdownHtml = anyBreakdown
      ? `<td>${breakdownBits.join(' · ') || '<span class="muted">—</span>'}${it.sourceNote ? `<div class="muted" style="margin-top:2px">${escapeHtml(it.sourceNote)}</div>` : ''}</td>`
      : '';
    return `<tr>
      <td>${escapeHtml(it.product?.name || '')}</td>
      <td>${escapeHtml(grade)}</td>
      <td class="right">${qty} ${escapeHtml(unit)}</td>
      ${breakdownHtml}
      <td class="right">${formatMoney(price)}</td>
      <td class="right">${formatMoney(line)}</td>
    </tr>`;
  }).join('');
  const total = order.totalAmount ?? items.reduce((s, it) => s + ((it.fulfilledQuantity ?? it.quantity) || 0) * (it.unitPrice || 0), 0);

  const html = `
    <div class="header">
      <div class="row">
        <div>
          <h1>Afood Lebanon</h1>
          <div class="muted">End-to-End Supply Chain</div>
        </div>
        <div style="text-align:right">
          <h2 style="margin:0">Invoice</h2>
          <div class="muted">#${escapeHtml(order.id?.slice(0, 8) || '')}</div>
          <span class="badge">${escapeHtml(order.status || '')}</span>
        </div>
      </div>
    </div>
    <div class="meta">
      <div><b>Billed to:</b> ${escapeHtml(order.client?.businessName || '')}</div>
      <div><b>Order created:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</div>
      <div><b>Contact:</b> ${escapeHtml(order.client?.contactPerson || order.placedBy ? `${order.placedBy?.firstName || ''} ${order.placedBy?.lastName || ''}` : '-')}</div>
      <div><b>Delivery date:</b> ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '-'}</div>
    </div>
    <table>
      <thead><tr>
        <th>Product</th><th>Grade</th><th class="right">Real Qty</th>
        ${anyBreakdown ? '<th>Source</th>' : ''}
        <th class="right">Unit Price</th><th class="right">Line Total</th>
      </tr></thead>
      <tbody>${lines || `<tr><td colspan="${anyBreakdown ? 6 : 5}" class="muted">No items</td></tr>`}</tbody>
      <tfoot><tr class="total-row"><td colspan="${anyBreakdown ? 5 : 4}" class="right">Total Due</td><td class="right">${formatMoney(total)}</td></tr></tfoot>
    </table>
    ${items.some((it) => it.specialInstructions) ? `
      <h2>Notes</h2>
      <ul style="font-size:12px; padding-left:18px;">
        ${items.filter((it) => it.specialInstructions).map((it) => `<li><b>${escapeHtml(it.product?.name)}:</b> ${escapeHtml(it.specialInstructions)}</li>`).join('')}
      </ul>
    ` : ''}
    ${order.dispatch?.freeBonusProduct || order.freeBonusProduct ? `
      <h2>Free Bonus</h2>
      <div style="font-size:13px; padding:8px 12px; border:1px dashed #999; border-radius:4px; background:#fafafa;">
        <b>Complimentary:</b> ${escapeHtml(order.dispatch?.freeBonusProduct || order.freeBonusProduct)}
      </div>
    ` : ''}
  `;
  openPrintWindow(`Invoice ${order.id?.slice(0, 8) || ''}`, html);
}

export function printTable({ title, subtitle, columns, rows }) {
  const head = `<tr>${columns.map((c) => `<th${c.align === 'right' ? ' class="right"' : ''}>${escapeHtml(c.label)}</th>`).join('')}</tr>`;
  const body = rows.map((r) => (
    `<tr>${columns.map((c) => `<td${c.align === 'right' ? ' class="right"' : ''}>${escapeHtml(r[c.key] ?? '')}</td>`).join('')}</tr>`
  )).join('');

  const html = `
    <div class="header">
      <div class="row">
        <div>
          <h1>Afood Lebanon</h1>
          <div class="muted">${escapeHtml(subtitle || '')}</div>
        </div>
        <div style="text-align:right">
          <h2 style="margin:0">${escapeHtml(title)}</h2>
          <div class="muted">Printed ${new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>
    <table>
      <thead>${head}</thead>
      <tbody>${body || `<tr><td colspan="${columns.length}" class="muted">No rows</td></tr>`}</tbody>
    </table>
  `;
  openPrintWindow(title, html);
}

export default { printInvoice, printTable };
