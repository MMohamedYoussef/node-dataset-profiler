function parseCsv(text) {
  if (typeof text !== 'string') throw new TypeError('CSV text is required');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('Unexpected CSV quote');
      quoted = true;
    } else if (char === ',' || char === '\n') {
      row.push(field); field = ''; closed = false;
      if (char === '\n') { rows.push(row); row = []; }
    } else if (char === '\r' && text[i + 1] === '\n') {
      continue;
    } else {
      if (closed) throw new Error('Characters after closing CSV quote');
      field += char;
    }
  }
  if (quoted) throw new Error('Unterminated CSV quote');
  if (field || row.length || closed) { row.push(field); rows.push(row); }
  return rows;
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function profileCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error('CSV header is required');
  const headers = rows.shift();
  if (headers.some(name => !name.trim()) || new Set(headers).size !== headers.length) throw new Error('Headers must be nonempty and unique');
  for (const row of rows) if (row.length !== headers.length) throw new Error(`Expected ${headers.length} fields, received ${row.length}`);
  const columns = headers.map((name, index) => {
    const values = rows.map(row => row[index].trim());
    const present = values.filter(value => value !== '');
    const numeric = present.length > 0 && present.every(value => /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value) && Number.isFinite(Number(value)));
    const dated = present.length > 0 && present.every(isDate);
    const column = { name, type: numeric ? 'number' : dated ? 'date' : 'text', missing: values.length - present.length, distinct: new Set(present).size };
    if (numeric) {
      let min = Infinity, max = -Infinity;
      for (const value of present) { const number = Number(value); min = Math.min(min, number); max = Math.max(max, number); }
      column.min = min; column.max = max;
    }
    return column;
  });
  return { rows: rows.length, columns };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function renderHtml(report) {
  const rows = report.columns.map(column => `<tr><td>${escapeHtml(column.name)}</td><td>${column.type}</td><td>${column.missing}</td><td>${column.distinct}</td><td>${column.min ?? '—'}</td><td>${column.max ?? '—'}</td></tr>`).join('\n');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Dataset profile</title><style>body{font:16px system-ui;max-width:900px;margin:3rem auto;padding:0 1rem;color:#17283b}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #cad4dd;text-align:left;padding:.7rem}th{background:#e7f0f5}h1{color:#086788}</style><h1>Dataset profile</h1><p>${report.rows} data rows</p><table><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Distinct</th><th>Minimum</th><th>Maximum</th></tr></thead><tbody>${rows}</tbody></table></html>\n`;
}
