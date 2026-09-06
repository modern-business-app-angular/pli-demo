import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { EnvironmentService } from '../../../core/config/environment.service';
import type { PagedResult, PaginationParams } from '../../../core/models/api-response.model';
import type {
  CourrierEntrant,
  CourrierEntrantFilters,
  CreateCourrierRequest,
} from '../models/courrier.model';
import type {
  Action,
  ChronoType,
  Criticite,
  FaireSuivreRequest,
  Nature,
  Personnel,
  Priorite,
} from '../models/action.model';
import type { ChampSpec, Maquette } from '../../administration/models/administration.models';

export type CourrierListParams = PaginationParams & CourrierEntrantFilters;

@Injectable({ providedIn: 'root' })
export class CourriersService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  private get base(): string {
    return this.env.apiBaseUrl;
  }

  // ─── Courriers list ──────────────────────────────────────────────────────

  getCourrierEntrantList(params: CourrierListParams): Observable<PagedResult<CourrierEntrant>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));

    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.statut) httpParams = httpParams.set('statut', params.statut);
    if (params.dateArriveeFrom) httpParams = httpParams.set('dateArriveeFrom', params.dateArriveeFrom);
    if (params.dateArriveeTo) httpParams = httpParams.set('dateArriveeTo', params.dateArriveeTo);
    if (params.chronoTypeId != null) httpParams = httpParams.set('chronoTypeId', String(params.chronoTypeId));

    return this.http.get<PagedResult<CourrierEntrant>>(
      `${this.base}/courriers/entrant`,
      { params: httpParams }
    );
  }

  getCourrierEntrant(id: number): Observable<CourrierEntrant> {
    return this.http.get<CourrierEntrant>(`${this.base}/courriers/entrant/${id}`);
  }

  createCourrierEntrant(req: CreateCourrierRequest): Observable<CourrierEntrant> {
    return this.http.post<CourrierEntrant>(`${this.base}/courriers/entrant`, req);
  }

  // ─── Faire suivre ────────────────────────────────────────────────────────

  faireSuivre(id: number, req: FaireSuivreRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/courriers/${id}/faire-suivre`, req);
  }

  // ─── Reference data ──────────────────────────────────────────────────────

  getActions(): Observable<Action[]> {
    return this.http.get<Action[]>(`${this.base}/actions`);
  }

  /**
   * Search personnel filtered by action destMode.
   * mode: Tous | SERVICES | PERSONNES | MEME | BALPers | BALServ | LISTEPOS
   */
  searchPersonnel(q: string, mode?: string): Observable<Personnel[]> {
    let httpParams = new HttpParams().set('q', q);
    if (mode) httpParams = httpParams.set('mode', mode);
    return this.http.get<Personnel[]>(`${this.base}/personnel`, { params: httpParams });
  }

  getChronoTypes(): Observable<ChronoType[]> {
    return this.http.get<ChronoType[]>(`${this.base}/chrono-types`);
  }

  getNatures(): Observable<Nature[]> {
    return this.http.get<Nature[]>(`${this.base}/natures`);
  }

  getPriorites(): Observable<Priorite[]> {
    return this.http.get<Priorite[]>(`${this.base}/priorites`);
  }

  getCriticites(): Observable<Criticite[]> {
    return this.http.get<Criticite[]>(`${this.base}/criticites`);
  }

  searchTriplets(q: string): Observable<{ id: number; label: string; details: string }[]> {
    return this.http.get<{ id: number; label: string; details: string }[]>(
      `${this.base}/triplets/search`,
      { params: new HttpParams().set('q', q) }
    );
  }

  // ─── Sortant / Interne lists ──────────────────────────────────────────────

  getCourrierSortantList(params: CourrierListParams): Observable<PagedResult<CourrierEntrant>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.sortBy)    httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.search)    httpParams = httpParams.set('search', params.search);
    if (params.statut)    httpParams = httpParams.set('statut', params.statut);
    return this.http.get<PagedResult<CourrierEntrant>>(`${this.base}/courriers/sortant`, { params: httpParams });
  }

  getCourrierInterneList(params: CourrierListParams): Observable<PagedResult<CourrierEntrant>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));
    if (params.sortBy)    httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.search)    httpParams = httpParams.set('search', params.search);
    if (params.statut)    httpParams = httpParams.set('statut', params.statut);
    return this.http.get<PagedResult<CourrierEntrant>>(`${this.base}/courriers/interne`, { params: httpParams });
  }

  createCourrierSortant(req: CreateCourrierRequest): Observable<CourrierEntrant> {
    return this.http.post<CourrierEntrant>(`${this.base}/courriers/sortant`, req);
  }

  createCourrierInterne(req: CreateCourrierRequest): Observable<CourrierEntrant> {
    return this.http.post<CourrierEntrant>(`${this.base}/courriers/interne`, req);
  }

  // ─── ChampSpec / Maquettes ────────────────────────────────────────────────

  getChampSpecPourCourrier(pageNom: string): Observable<ChampSpec[]> {
    return this.http.get<ChampSpec[]>(`${this.base}/pages-spec/${pageNom}/champs`);
  }

  getMaquettesByType(type: 'AR' | 'REP' | 'BOR'): Observable<Maquette[]> {
    return this.http.get<Maquette[]>(`${this.base}/maquettes`, {
      params: new HttpParams().set('type', type),
    });
  }

  getMaquettePreviewHtml(id: number): Observable<{ html: string; tags: string[] }> {
    return this.http.get<{ html: string; tags: string[] }>(`${this.base}/maquettes/${id}/preview-html`);
  }
}
