import { inferOutcome } from './safetyState.js';

const OUTCOME_LABELS = {
  link: 'Invites / Links',
  success: 'Invited Success',
  failed: 'Failed',
  left: 'Customer Leaved',
};

export function filterActivityRows(history = [], { outcome = 'all', method = 'all', q = '' } = {}) {
  const needle = String(q || '').trim().toLowerCase();
  const cleanOutcome = String(outcome || 'all').toLowerCase();
  const cleanMethod = String(method || 'all');

  return (history || []).filter(r => {
    const out = inferOutcome(r);
    if (cleanOutcome !== 'all' && out !== cleanOutcome) return false;
    if (cleanMethod !== 'all' && !String(r.option || '').startsWith(cleanMethod)) return false;
    if (!needle) return true;
    return [r.name, r.target, r.username, r.phone, r.inviteName, r.status, r.reason, r.chatTitle]
      .some(x => String(x || '').toLowerCase().includes(needle));
  });
}

function rowToExportCells(r) {
  const out = inferOutcome(r);
  const methodLabel = String(r.option || '').includes('OPTION_2') ? 'Option 2 (MTProto)' : 'Option 1 (Bot API)';
  return [
    r.name || r.target || '',
    r.target || '',
    r.phone || '',
    r.username ? `@${String(r.username).replace(/^@/, '')}` : '',
    methodLabel,
    OUTCOME_LABELS[out] || out,
    r.status || '',
    r.reason || r.inviteName || '',
    r.inviteLink || '',
    r.chatTitle || '',
    r.at || '',
  ];
}

const HEADERS = [
  'Customer Name',
  'Target',
  'Phone',
  'Username',
  'Method',
  'Category',
  'Status',
  'Details / Reason',
  'Invite Link',
  'Group / Chat',
  'Timestamp (ISO)',
];

function csvCell(val) {
  let s = String(val ?? '');
  // Guard dangerous spreadsheet formula prefixes while keeping real phone numbers & @handles intact
  if (/^[=\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCsvExport(rows = []) {
  const lines = [HEADERS.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(rowToExportCells(r).map(csvCell).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function escXml(val) {
  return String(val ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildExcelExport(rows = [], sheetName = 'Tenh Gram Activity') {
  const safeSheet = escXml(String(sheetName || 'Activity').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
  const headerXml = `<Row ss:StyleID="hdr">${HEADERS.map(h => `<Cell><Data ss:Type="String">${escXml(h)}</Data></Cell>`).join('')}</Row>`;
  const bodyXml = rows
    .map(r => `<Row>${rowToExportCells(r).map(v => `<Cell><Data ss:Type="String">${escXml(v)}</Data></Cell>`).join('')}</Row>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="hdr">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#16537E" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${safeSheet}">
  <Table>
   ${headerXml}
   ${bodyXml}
  </Table>
 </Worksheet>
</Workbook>
`;
}
