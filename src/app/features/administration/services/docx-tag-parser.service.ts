import { Injectable } from '@angular/core';
import type { DocxParseResult } from '../models/administration.models';

/**
 * In-browser .docx parser that extracts Word MERGEFIELD names and/or {{mustache}} placeholders.
 *
 * No external npm packages — uses only:
 *   - FileReader / ArrayBuffer (all browsers)
 *   - DecompressionStream('deflate-raw') — Chrome 80+, Firefox 113+, Safari 16.4+
 *   - TextDecoder
 */
@Injectable({ providedIn: 'root' })
export class DocxTagParserService {

  async parseFile(blob: Blob): Promise<DocxParseResult> {
    try {
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const xmlParts = await this._extractWordXml(bytes);

      const mergeFields = new Set<string>();
      const mustacheTags = new Set<string>();

      for (const xml of xmlParts) {
        // MERGEFIELD detection — search raw XML before tag stripping
        // Word stores: <w:instrText> MERGEFIELD FieldName \* MERGEFORMAT </w:instrText>
        for (const m of xml.matchAll(/MERGEFIELD\s+(\w+)/g)) {
          mergeFields.add(m[1]);
        }

        // Mustache detection — strip XML tags first to handle run-splitting
        // Word can split {{Foo}} across multiple <w:r> runs
        const stripped = xml.replace(/<[^>]+>/g, '');
        for (const m of stripped.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)) {
          mustacheTags.add(m[1]);
        }
      }

      const foundTags = [...new Set([...mergeFields, ...mustacheTags])];
      const hasMerge   = mergeFields.size > 0;
      const hasMustache = mustacheTags.size > 0;

      let detectedMode: DocxParseResult['detectedMode'] = 'none';
      if (hasMerge && hasMustache) detectedMode = 'mixed';
      else if (hasMerge)           detectedMode = 'mergefield';
      else if (hasMustache)        detectedMode = 'mustache';

      return { status: 'done', foundTags, detectedMode };
    } catch (err) {
      return {
        status: 'error',
        foundTags: [],
        detectedMode: 'none',
        errorMessage: err instanceof Error ? err.message : 'Erreur inconnue lors de l\'analyse.',
      };
    }
  }

  // ── ZIP parser ───────────────────────────────────────────────────────────────

  private async _extractWordXml(bytes: Uint8Array): Promise<string[]> {
    const results: string[] = [];
    let offset = 0;

    while (offset < bytes.length - 4) {
      // ZIP local file header signature: PK\x03\x04
      if (
        bytes[offset]     !== 0x50 || bytes[offset + 1] !== 0x4b ||
        bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04
      ) {
        offset++;
        continue;
      }

      const compressionMethod = bytes[offset + 8]  | (bytes[offset + 9]  << 8);
      const compressedSize    = bytes[offset + 18] | (bytes[offset + 19] << 8) |
                                (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
      const fileNameLength    = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraFieldLength  = bytes[offset + 28] | (bytes[offset + 29] << 8);

      const fileNameStart = offset + 30;
      const fileNameBytes = bytes.slice(fileNameStart, fileNameStart + fileNameLength);
      const fileName = new TextDecoder().decode(fileNameBytes);

      const dataStart = fileNameStart + fileNameLength + extraFieldLength;
      const dataEnd   = dataStart + compressedSize;

      // Only process the relevant Word XML parts
      const isWordXml =
        fileName === 'word/document.xml' ||
        fileName.startsWith('word/header') ||
        fileName.startsWith('word/footer');

      if (isWordXml && dataEnd <= bytes.length) {
        const compressedData = bytes.slice(dataStart, dataEnd);
        try {
          const xml = compressionMethod === 0
            ? new TextDecoder().decode(compressedData)
            : await this._inflate(compressedData);
          results.push(xml);
        } catch {
          // Skip unreadable parts — don't fail the whole parse
        }
      }

      // Advance past this local file entry
      if (dataEnd > offset) {
        offset = dataEnd;
      } else {
        offset++;
      }
    }

    return results;
  }

  private async _inflate(data: Uint8Array): Promise<string> {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(data as unknown as ArrayBuffer);
    writer.close();

    const chunks: Uint8Array[] = [];
    const reader = ds.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Uint8Array(total);
    let pos = 0;
    for (const chunk of chunks) {
      merged.set(chunk, pos);
      pos += chunk.length;
    }
    return new TextDecoder('utf-8').decode(merged);
  }
}
