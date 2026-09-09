const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const encodeText = (value) => {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value);
  const encoded = unescape(encodeURIComponent(value));
  return Uint8Array.from(encoded, (char) => char.charCodeAt(0));
};

const toRows = (rows = []) => (Array.isArray(rows) ? rows : []);

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatLabel = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const sanitizeSheetName = (value, fallback = "Sheet") =>
  String(value || fallback)
    .replace(/[:\\/?*[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31) || fallback;

const sanitizeFilename = (filename, fallback = "CodeQuest_Report.xlsx") => {
  const base = String(filename || fallback)
    .replace(/\.html?$/i, "")
    .replace(/\.xlsx$/i, "")
    .replace(/[<>:"/\\|?*]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base || fallback.replace(/\.xlsx$/i, "")}.xlsx`;
};

const xmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const normalizeCellValue = (value) => {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const objectRowsToMatrix = (rows = []) => {
  const safeRows = toRows(rows);
  const keys = Array.from(
    safeRows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );

  if (!safeRows.length || !keys.length) {
    return [["Message"], ["No data available for export."]];
  }

  return [
    keys.map(formatLabel),
    ...safeRows.map((row) => keys.map((key) => normalizeCellValue(row?.[key]))),
  ];
};

const pairsToMatrix = (rows = []) => {
  const safeRows = toRows(rows);
  if (!safeRows.length) return [["Metric", "Value"], ["No data available", ""]];
  return [["Metric", "Value"], ...safeRows.map(({ label, value }) => [formatLabel(label), normalizeCellValue(value)])];
};

const chartToMatrix = (chart) => {
  const matrix = objectRowsToMatrix(chart.data || []);
  if (matrix.length === 2 && matrix[1][0] === "No data available for export.") return matrix;

  const notes = [["Chart Type", chart.type || "line"]];
  if (chart.xKey) notes.push(["X Axis", formatLabel(chart.xKey)]);
  if (chart.series?.length) {
    notes.push(["Series", chart.series.map((item) => item.label || formatLabel(item.key)).join(", ")]);
  }
  return [...notes, [], ...matrix];
};

const createWorkbookSheets = ({ title, subtitle, filters, kpis, sections, charts }) => {
  const generatedAt = new Date().toLocaleString();
  const sheets = [
    {
      name: "Overview",
      rows: [
        ["Report", title || "CodeQuest Report"],
        ["Description", subtitle || ""],
        ["Generated At", generatedAt],
        [],
        ["Filters"],
        ...pairsToMatrix(filters).slice(1),
        [],
        ["Summary"],
        ...pairsToMatrix(kpis).slice(1),
      ],
    },
  ];

  charts.forEach((chart, index) => {
    sheets.push({
      name: sanitizeSheetName(chart.title, `Chart ${index + 1}`),
      rows: chartToMatrix(chart),
    });
  });

  sections.forEach((section, index) => {
    sheets.push({
      name: sanitizeSheetName(section.title, `Data ${index + 1}`),
      rows: objectRowsToMatrix(section.rows || []),
    });
  });

  if (sheets.length === 1 && !filters.length && !kpis.length) {
    sheets[0].rows.push([], ["Message", "No data available for export."]);
  }

  return sheets;
};

const columnName = (index) => {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
};

const worksheetXml = (rows = []) => {
  const columnWidths = [];
  rows.forEach((row) => {
    row.forEach((value, index) => {
      columnWidths[index] = Math.min(Math.max(columnWidths[index] || 10, String(value ?? "").length + 2), 42);
    });
  });

  const cols = columnWidths.length
    ? `<cols>${columnWidths
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";

  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = `${columnName(colIndex + 1)}${rowIndex + 1}`;
          const normalized = normalizeCellValue(value);
          const numeric = typeof normalized === "number" && Number.isFinite(normalized);
          const style = rowIndex === 0 || (row.length === 1 && normalized) ? ' s="1"' : "";
          if (numeric) return `<c r="${ref}"${style}><v>${normalized}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${style}><is><t>${xmlEscape(normalized)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${sheetRows}</sheetData></worksheet>`;
};

const workbookXml = (sheets) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
  .map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
  .join("")}</sheets></workbook>`;

const workbookRelsXml = (sheets) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
  .map(
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  )
  .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const contentTypesXml = (sheets) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
  .map(
    (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join("")}</Types>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const pushUint16 = (target, value) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushUint32 = (target, value) => {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

const createZip = (files) => {
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = encodeText(name);
    const data = typeof content === "string" ? encodeText(content) : content;
    const crc = crc32(data);
    const localHeader = [];

    pushUint32(localHeader, 0x04034b50);
    pushUint16(localHeader, 20);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint32(localHeader, crc);
    pushUint32(localHeader, data.length);
    pushUint32(localHeader, data.length);
    pushUint16(localHeader, nameBytes.length);
    pushUint16(localHeader, 0);

    chunks.push(new Uint8Array(localHeader), nameBytes, data);

    const centralHeader = [];
    pushUint32(centralHeader, 0x02014b50);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, crc);
    pushUint32(centralHeader, data.length);
    pushUint32(centralHeader, data.length);
    pushUint16(centralHeader, nameBytes.length);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, 0);
    pushUint32(centralHeader, offset);
    centralDirectory.push(new Uint8Array(centralHeader), nameBytes);

    offset += localHeader.length + nameBytes.length + data.length;
  });

  const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  const endRecord = [];
  pushUint32(endRecord, 0x06054b50);
  pushUint16(endRecord, 0);
  pushUint16(endRecord, 0);
  pushUint16(endRecord, files.length);
  pushUint16(endRecord, files.length);
  pushUint32(endRecord, centralSize);
  pushUint32(endRecord, offset);
  pushUint16(endRecord, 0);

  return new Blob([...chunks, ...centralDirectory, new Uint8Array(endRecord)], { type: XLSX_MIME });
};

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function filenameFromContentDisposition(disposition, fallback = "CodeQuest_Report.xlsx") {
  const header = String(disposition || "");
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) return sanitizeFilename(decodeURIComponent(utfMatch[1].replace(/"/g, "")), fallback);
  const match = header.match(/filename="?([^";]+)"?/i);
  return sanitizeFilename(match?.[1] || fallback, fallback);
}

export function downloadBlobResponse(response, fallbackFilename) {
  const status = response?.status ?? 200;
  if (status < 200 || status >= 300 || !response?.data) {
    throw new Error("Report download failed.");
  }
  const filename = filenameFromContentDisposition(response?.headers?.["content-disposition"], fallbackFilename);
  downloadBlob(response.data, filename);
  return filename;
}

export function downloadAnalyticsReport({ title, subtitle, filename, filters = [], kpis = [], sections = [], charts = [] }) {
  const sheets = createWorkbookSheets({ title, subtitle, filters, kpis, sections, charts });
  const files = [
    { name: "[Content_Types].xml", content: contentTypesXml(sheets) },
    {
      name: "_rels/.rels",
      content:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    { name: "xl/workbook.xml", content: workbookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml(sheets) },
    { name: "xl/styles.xml", content: stylesXml },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet.rows),
    })),
  ];

  downloadBlob(createZip(files), sanitizeFilename(filename || `${title || "CodeQuest_Report"}.xlsx`));
}
