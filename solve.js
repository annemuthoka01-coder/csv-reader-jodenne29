// solve.js - Fast dependency-free CSV reader drop-in replacement for csv-reader 1.0.0
// Scans with String.indexOf and builds fields using slice segments for speed.

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const len = text.length;
  let pos = 0;
  let line = 1;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let recordLine = 1;
  let recordRow = null;

  function fail(code, recLine, recRow) {
    errors.push({ code, line: recLine, row: recRow });
  }

  function readUnquoted(prefix, recLine, recRow) {
    let value = prefix;
    let added = 0;
    while (pos < len) {
      const commaIdx = text.indexOf(',', pos);
      const lfIdx = text.indexOf('\n', pos);
      const crIdx = text.indexOf('\r', pos);

      let nextIdx = len;
      let delim = 'end';
      if (commaIdx !== -1 && commaIdx < nextIdx) { nextIdx = commaIdx; delim = 'comma'; }
      if (lfIdx !== -1 && lfIdx < nextIdx) { nextIdx = lfIdx; delim = 'lf'; }
      if (crIdx !== -1 && crIdx < nextIdx) { nextIdx = crIdx; delim = 'cr'; }

      if (nextIdx > pos) {
        const seg = text.slice(pos, nextIdx);
        value += seg;
        added += (nextIdx - pos);
        pos = nextIdx;
      }

      if (delim === 'comma') {
        pos += 1;
        return [value, 0, added];
      }
      if (delim === 'lf') {
        pos += 1;
        line += 1;
        return [value, 1, added];
      }
      if (delim === 'cr') {
        if (pos + 1 < len && text.charCodeAt(pos + 1) === 10) { // '\n'
          pos += 2;
          line += 1;
          return [value, 1, added];
        }
        fail('stray_cr', recLine, recRow);
        pos += 1;
        continue;
      }
      // delim === 'end'
      break;
    }
    return [value, 2, added];
  }

  function readQuoted(recLine, recRow) {
    const open = pos;
    const openLine = line;
    pos += 1; // skip opening quote

    // Search ONCE for the closing quote (a doubled "" is an escaped quote, not the close)
    let closeIdx = -1;
    let searchPos = pos;
    while (searchPos < len) {
      const qIdx = text.indexOf('"', searchPos);
      if (qIdx === -1) break;
      if (qIdx + 1 < len && text.charCodeAt(qIdx + 1) === 34) {
        searchPos = qIdx + 2;
        continue;
      }
      closeIdx = qIdx;
      break;
    }

    if (closeIdx === -1) {
      pos = open + 1;
      line = openLine;
      fail('unterminated_quote', recLine, recRow);
      return readUnquoted('"', recLine, recRow);
    }

    const bodyStart = pos;
    const bodyEnd = closeIdx;
    pos = closeIdx + 1; // past closing quote

    let value = '';
    const qInBody = text.indexOf('"', bodyStart);
    const crInBody = text.indexOf('\r', bodyStart);
    const hasComplex = (qInBody !== -1 && qInBody < bodyEnd) || (crInBody !== -1 && crInBody < bodyEnd);

    if (!hasComplex) {
      value = text.slice(bodyStart, bodyEnd);
      let lfIdx = text.indexOf('\n', bodyStart);
      while (lfIdx !== -1 && lfIdx < bodyEnd) {
        line += 1;
        lfIdx = text.indexOf('\n', lfIdx + 1);
      }
    } else {
      let cur = bodyStart;
      while (cur < bodyEnd) {
        const nextQuote = text.indexOf('"', cur);
        const nextCr = text.indexOf('\r', cur);
        const nextLf = text.indexOf('\n', cur);

        let nxt = bodyEnd;
        let kind = 'none';
        if (nextQuote !== -1 && nextQuote < nxt) { nxt = nextQuote; kind = 'quote'; }
        if (nextCr !== -1 && nextCr < nxt) { nxt = nextCr; kind = 'cr'; }
        if (nextLf !== -1 && nextLf < nxt) { nxt = nextLf; kind = 'lf'; }

        if (nxt > cur) {
          value += text.slice(cur, nxt);
          cur = nxt;
        }

        if (kind === 'quote') {
          if (cur + 1 < bodyEnd && text.charCodeAt(cur + 1) === 34) {
            value += '"';
            cur += 2;
          } else {
            cur += 1;
          }
        } else if (kind === 'cr') {
          value += '\n';
          line += 1;
          if (cur + 1 < bodyEnd && text.charCodeAt(cur + 1) === 10) {
            cur += 2;
          } else {
            cur += 1;
          }
        } else if (kind === 'lf') {
          value += '\n';
          line += 1;
          cur += 1;
        } else {
          break;
        }
      }
    }
    if (pos >= len) return [value, 2];
    const c = text[pos];
    if (c === ',') {
      pos += 1;
      return [value, 0];
    }
    if (c === '\n') {
      pos += 1;
      line += 1;
      return [value, 1];
    }
    if (c === '\r' && pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
      pos += 2;
      line += 1;
      return [value, 1];
    }

    const [junkVal, junkEnded, added] = readUnquoted(value, recLine, recRow);
    if (added > 0) {
      fail('quote_junk', recLine, recRow);
    }
    return [junkVal, junkEnded];
  }

  if (text.charCodeAt(0) === 65279) pos = 1; // U+FEFF BOM check

  while (true) {
    while (pos < len) {
      const code = text.charCodeAt(pos);
      if (code === 10) {
        pos += 1;
        line += 1;
      } else if (code === 13 && pos + 1 < len && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;

    const fields = [];
    let quoted = false;
    let ended = 0;

    do {
      quoted = text.charCodeAt(pos) === 34; // '"'
      let val;
      if (quoted) {
        [val, ended] = readQuoted(recordLine, recordRow);
      } else {
        [val, ended] = readUnquoted('', recordLine, recordRow);
      }
      fields.push(val);
    } while (ended === 0);

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }

    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return {
    columns: header ? (columns ?? []) : null,
    rows,
    errors
  };
}
