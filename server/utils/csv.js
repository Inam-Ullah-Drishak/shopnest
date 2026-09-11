// A small CSV parser. Handles quoted fields, escaped quotes and newlines
// inside quotes, which a naive split(',') would break on.
export const parseCsv = (text) => {
  // Strip the BOM Excel adds
  const clean = text.replace(/^\uFEFF/, '');

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  // Whatever is left after the last newline
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0].map((h) => h.trim());

  const records = rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => {
      const record = {};
      headers.forEach((h, i) => {
        record[h] = (r[i] ?? '').trim();
      });
      return record;
    });

  return { headers, records };
};