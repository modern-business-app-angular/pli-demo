import { Injectable, inject } from '@angular/core';
import { EnvironmentService } from '../../../core/config/environment.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { Maquette, LogEntry, MailLog, MailArchive, SystemConfig, PageSpec, ChampSpec, MaquetteTagsConfig } from '../models/administration.models';

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(EnvironmentService).apiBaseUrl;

  // ── Maquettes ──────────────────────────────────────────────────

  getMaquettes(params?: HttpParams): Observable<Maquette[]> {
    return this.http.get<Maquette[]>(`${this.base}/maquettes`, { params });
  }

  createMaquette(body: Partial<Maquette>, file?: File): Observable<Maquette> {
    if (file) {
      const fd = new FormData();
      fd.append('file', file, file.name);
      Object.entries(body).forEach(([k, v]) => v != null && fd.append(k, String(v)));
      fd.append('filename', file.name);
      fd.append('extension', '.' + file.name.split('.').pop()!.toLowerCase());
      return this.http.post<Maquette>(`${this.base}/maquettes`, fd);
    }
    return this.http.post<Maquette>(`${this.base}/maquettes`, body);
  }

  updateMaquette(id: number, body: Partial<Maquette>, file?: File): Observable<Maquette> {
    if (file) {
      const fd = new FormData();
      fd.append('file', file, file.name);
      Object.entries(body).forEach(([k, v]) => v != null && fd.append(k, String(v)));
      fd.append('filename', file.name);
      fd.append('extension', '.' + file.name.split('.').pop()!.toLowerCase());
      return this.http.put<Maquette>(`${this.base}/maquettes/${id}`, fd);
    }
    return this.http.put<Maquette>(`${this.base}/maquettes/${id}`, body);
  }

  deleteMaquette(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/maquettes/${id}`);
  }

  duplicateMaquette(id: number): Observable<Maquette> {
    return this.http.post<Maquette>(`${this.base}/maquettes/${id}/duplicate`, {});
  }

  /** WebDAV URL used by ms-word: deep link and Word auto-save target. */
  getMaquetteFileUrl(id: number): string {
    return `${this.base}/maquettes/${id}/file`;
  }

  /** GET /api/maquettes/:id/file → Blob (fallback download or in-browser analysis). */
  getMaquetteFile(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/maquettes/${id}/file`, { responseType: 'blob' });
  }

  /** HEAD /api/maquettes/:id/file → Last-Modified header (polling to detect Word save). */
  getMaquetteLastModified(id: number): Observable<string | null> {
    return this.http.head(`${this.base}/maquettes/${id}/file`, { observe: 'response' })
      .pipe(map((r) => r.headers.get('Last-Modified')));
  }

  /** URL of the CSV catalog data source for Word Publipostage. */
  getCatalogDatasourceUrl(): string {
    return `${this.base}/maquettes/catalog-datasource`;
  }

  /** GET /api/maquettes/catalog-datasource → CSV text (downloaded client-side as a Blob). */
  getCatalogDatasourceCsv(): Observable<string> {
    return this.http.get(`${this.base}/maquettes/catalog-datasource`, { responseType: 'text' });
  }

  /** GET /api/maquettes/:id/tags — last known tag parse result. */
  getMaquetteTags(id: number): Observable<MaquetteTagsConfig> {
    return this.http.get<MaquetteTagsConfig>(`${this.base}/maquettes/${id}/tags`);
  }

  /** PUT /api/maquettes/:id/tags — persist tag analysis result. */
  saveMaquetteTags(id: number, body: Partial<MaquetteTagsConfig>): Observable<MaquetteTagsConfig> {
    return this.http.put<MaquetteTagsConfig>(`${this.base}/maquettes/${id}/tags`, body);
  }

  // ── Maintenance log ───────────────────────────────────────────

  getLogs(params?: HttpParams): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(`${this.base}/maintenance-logs`, { params });
  }

  deleteLog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/maintenance-logs/${id}`);
  }

  // ── Mail archives ─────────────────────────────────────────────

  getMailsArchives(params?: HttpParams): Observable<MailArchive[]> {
    return this.http.get<MailArchive[]>(`${this.base}/mails-archives`, { params });
  }

  // ── Journal des mails ─────────────────────────────────────────

  getJournalMails(params?: HttpParams): Observable<MailLog[]> {
    return this.http.get<MailLog[]>(`${this.base}/journal-mails`, { params });
  }

  // ── System config ─────────────────────────────────────────────

  getConfig(): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(`${this.base}/system-config`);
  }

  saveConfig(body: SystemConfig): Observable<SystemConfig> {
    return this.http.put<SystemConfig>(`${this.base}/system-config`, body);
  }

  // ── Personnalisation des champs ───────────────────────────────

  getPages(): Observable<PageSpec[]> {
    return this.http.get<PageSpec[]>(`${this.base}/pages-spec`);
  }

  createPage(body: Pick<PageSpec, 'nom' | 'nomTable'>): Observable<PageSpec> {
    return this.http.post<PageSpec>(`${this.base}/pages-spec`, body);
  }

  deletePage(nom: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/pages-spec/${nom}`);
  }

  getChamps(pageNom: string): Observable<ChampSpec[]> {
    return this.http.get<ChampSpec[]>(`${this.base}/pages-spec/${pageNom}/champs`);
  }

  createChamp(pageNom: string, body: Partial<ChampSpec>): Observable<ChampSpec> {
    return this.http.post<ChampSpec>(`${this.base}/pages-spec/${pageNom}/champs`, body);
  }

  updateChamp(pageNom: string, id: number, body: Partial<ChampSpec>): Observable<ChampSpec> {
    return this.http.put<ChampSpec>(`${this.base}/pages-spec/${pageNom}/champs/${id}`, body);
  }

  deleteChamp(pageNom: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/pages-spec/${pageNom}/champs/${id}`);
  }

  reorderChamps(pageNom: string, orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.base}/pages-spec/${pageNom}/champs/reorder`, { orderedIds });
  }
}
