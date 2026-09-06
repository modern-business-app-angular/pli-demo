import { http, HttpResponse } from 'msw';

import { API_BASE as BASE } from '../mock-origin';

/**
 * Minimal stub .docx bytes — a valid ZIP with a word/document.xml containing
 * two MERGEFIELD references and one {{mustache}} placeholder for demo purposes.
 */
const STUB_DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Objet : </w:t></w:r>
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText xml:space="preserve"> MERGEFIELD Objet \\* MERGEFORMAT </w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
    </w:p>
    <w:p><w:r><w:t>Madame, Monsieur </w:t></w:r>
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText xml:space="preserve"> MERGEFIELD NomComplet \\* MERGEFORMAT </w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
    </w:p>
    <w:p><w:r><w:t>Signé par {{NomSig}}, le </w:t></w:r>
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText xml:space="preserve"> MERGEFIELD DateDuJour \\* MERGEFORMAT </w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
    </w:p>
  </w:body>
</w:document>`;

/** Build a minimal in-memory ZIP containing word/document.xml (stored, no compression). */
function buildStubDocx(): Uint8Array {
  const enc = new TextEncoder();
  const fileName = 'word/document.xml';
  const fileData = enc.encode(STUB_DOCUMENT_XML);
  const fileNameBytes = enc.encode(fileName);

  // Local file header (stored, method=0)
  const localHeader = new Uint8Array(30 + fileNameBytes.length + fileData.length);
  const view = new DataView(localHeader.buffer);
  view.setUint32(0,  0x04034b50, true); // signature
  view.setUint16(4,  20, true);          // version needed
  view.setUint16(6,  0, true);           // flags
  view.setUint16(8,  0, true);           // compression: stored
  view.setUint16(10, 0, true);           // mod time
  view.setUint16(12, 0, true);           // mod date
  view.setUint32(14, 0, true);           // CRC-32 (stub)
  view.setUint32(18, fileData.length, true); // compressed size
  view.setUint32(22, fileData.length, true); // uncompressed size
  view.setUint16(26, fileNameBytes.length, true);
  view.setUint16(28, 0, true);           // extra field length
  localHeader.set(fileNameBytes, 30);
  localHeader.set(fileData, 30 + fileNameBytes.length);

  // Central directory entry
  const centralEntry = new Uint8Array(46 + fileNameBytes.length);
  const cv = new DataView(centralEntry.buffer);
  cv.setUint32(0, 0x02014b50, true);  // central dir signature
  cv.setUint16(4, 20, true);
  cv.setUint16(6, 20, true);
  cv.setUint16(8, 0, true);
  cv.setUint16(10, 0, true);
  cv.setUint16(12, 0, true);
  cv.setUint16(14, 0, true);
  cv.setUint32(16, 0, true);           // CRC-32 (stub)
  cv.setUint32(20, fileData.length, true);
  cv.setUint32(24, fileData.length, true);
  cv.setUint16(28, fileNameBytes.length, true);
  cv.setUint16(30, 0, true);
  cv.setUint16(32, 0, true);
  cv.setUint16(34, 0, true);
  cv.setUint16(36, 0, true);
  cv.setUint32(38, 0, true);
  cv.setUint32(42, 0, true);           // local header offset
  centralEntry.set(fileNameBytes, 46);

  // End of central directory
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, 1, true);  // total entries on disk
  ev.setUint16(10, 1, true); // total entries
  ev.setUint32(12, centralEntry.length, true);
  ev.setUint32(16, localHeader.length, true);
  ev.setUint16(20, 0, true);

  const zip = new Uint8Array(localHeader.length + centralEntry.length + eocd.length);
  zip.set(localHeader, 0);
  zip.set(centralEntry, localHeader.length);
  zip.set(eocd, localHeader.length + centralEntry.length);
  return zip;
}

// Mutable store so the PUT (Word auto-save) updates Last-Modified
const fileStore: { bytes: Uint8Array; lastModified: string } = {
  bytes: buildStubDocx(),
  lastModified: new Date().toUTCString(),
};

const tagStore = new Map<number, { lastFoundTags: string[]; lastParsedAt: string }>();
tagStore.set(1, { lastFoundTags: ['Objet', 'NomComplet', 'NomSig', 'DateDuJour'], lastParsedAt: '2026-03-15T10:30:00' });

export const maquetteTagsHandlers = [

  // ── WebDAV OPTIONS — Word capability check before opening ──────────────────
  http.options(`${BASE}/maquettes/:id/file`, () =>
    new HttpResponse(null, {
      status: 200,
      headers: {
        'DAV':           '1,2',
        'MS-Author-Via': 'DAV',
        'Allow':         'OPTIONS,GET,PUT,HEAD',
      },
    })
  ),

  // ── GET catalog-datasource FIRST (more specific path, before :id/file) ─────
  http.get(`${BASE}/maquettes/catalog-datasource`, () => {
    const csv = [
      'Civilite,Nom,Prenom,NomComplet,Email,Tel,AdresseLigne1,AdresseLigne2,CodePostal,Ville,Pays,' +
      'Chrono,Objet,DateEnregistrement,DateLimite,DateEnvoi,Nature,NatureCode,Priorite,RefExterne,' +
      'ServiceNom,ServiceCode,DossierNom,DossierRef,' +
      'CiviliteSig,NomSig,PrenomSig,FonctionSig,' +
      'OrganisationNom,OrganisationAdresse,OrganisationCP,OrganisationVille,OrganisationTel,OrganisationEmail,LogoUrl,' +
      'DateDuJour,DateDuJourLong,AnneeEnCours,HeureGeneration',

      '"M.","DUPONT","Jean","M. Jean DUPONT","jean.dupont@example.fr","01 23 45 67 89","12 rue de la Paix","","75001","PARIS","France",' +
      '"2026-003421","Demande de renseignements","19/03/2026","02/04/2026","20/03/2026","Plainte","PLT","Urgente","REF-2026-0099",' +
      '"Direction des affaires générales","DAG","Dossier urbanisme 2026","DOS-2026-0042",' +
      '"M.","MARTIN","Pierre","Directeur général des services",' +
      '"Mairie de Paris","Hôtel de Ville","75004","PARIS","01 42 76 40 40","contact@paris.fr","",' +
      '"19/03/2026","jeudi 19 mars 2026","2026","14:32:07"',
    ].join('\r\n') + '\r\n';

    return new HttpResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pli-catalog.csv"',
      },
    });
  }),

  // ── GET file ───────────────────────────────────────────────────────────────
  http.get(`${BASE}/maquettes/:id/file`, ({ params }) =>
    new HttpResponse(fileStore.bytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="maquette-${params['id']}.docx"`,
        'Last-Modified':       fileStore.lastModified,
        'Content-Length':      String(fileStore.bytes.length),
      },
    })
  ),

  // ── HEAD file — polling for Last-Modified changes ─────────────────────────
  http.head(`${BASE}/maquettes/:id/file`, () =>
    new HttpResponse(null, {
      status: 200,
      headers: {
        'Content-Type':  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Last-Modified': fileStore.lastModified,
      },
    })
  ),

  // ── PUT file — Word auto-saves via WebDAV ──────────────────────────────────
  http.put(`${BASE}/maquettes/:id/file`, async ({ request }) => {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      fileStore.bytes = new Uint8Array(body);
    }
    fileStore.lastModified = new Date().toUTCString();
    return new HttpResponse(null, { status: 200 });
  }),

  // ── GET tags — last known parse result ────────────────────────────────────
  http.get(`${BASE}/maquettes/:id/tags`, ({ params }) => {
    const id = Number(params['id']);
    const stored = tagStore.get(id) ?? { lastFoundTags: [], lastParsedAt: undefined };
    return HttpResponse.json({ maquetteId: id, ...stored });
  }),

  // ── PUT tags — save parse result ──────────────────────────────────────────
  http.put(`${BASE}/maquettes/:id/tags`, async ({ request, params }) => {
    const id = Number(params['id']);
    const body = await request.json() as { lastFoundTags?: string[]; lastParsedAt?: string };
    tagStore.set(id, {
      lastFoundTags: body.lastFoundTags ?? [],
      lastParsedAt:  body.lastParsedAt ?? new Date().toISOString(),
    });
    return HttpResponse.json({ maquetteId: id, ...tagStore.get(id) });
  }),
];
