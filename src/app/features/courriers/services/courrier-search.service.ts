import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EnvironmentService } from '../../../core/config/environment.service';
import { SearchService } from '../../search/services/search.service';
import type { PagedResult } from '../../../core/models/api-response.model';
import type { CourrierEntrant, CourrierSearchQuery } from '../models/courrier.model';
import type { Action, ChronoType, Nature, Personnel } from '../models/action.model';
import type { ChampSpec } from '../../administration/models/administration.models';
import type { SearchModel } from '../../search/models/search.models';

export interface CourrierSearchRefData {
  natures: Nature[];
  chronoTypes: ChronoType[];
  actions: Action[];
  personnel: Personnel[];
  champsSpec: ChampSpec[];
}

@Injectable({ providedIn: 'root' })
export class CourrierSearchService {
  private readonly http        = inject(HttpClient);
  private readonly env         = inject(EnvironmentService);
  private readonly searchSvc   = inject(SearchService);

  private get base(): string { return this.env.apiBaseUrl; }

  // ── Search execution ────────────────────────────────────────────────────

  executeSearch(query: CourrierSearchQuery): Observable<PagedResult<CourrierEntrant>> {
    return this.http.post<PagedResult<CourrierEntrant>>(
      `${this.base}/courriers/search`, query
    );
  }

  // ── Reference data ──────────────────────────────────────────────────────

  loadRefData(pageSpecNom = 'courrier-entrant'): Observable<CourrierSearchRefData> {
    return forkJoin({
      natures:     this.http.get<Nature[]>(`${this.base}/natures`),
      chronoTypes: this.http.get<ChronoType[]>(`${this.base}/chrono-types`),
      actions:     this.http.get<Action[]>(`${this.base}/actions`),
      personnel:   this.http.get<Personnel[]>(`${this.base}/personnel`),
      champsSpec:  this.http.get<ChampSpec[]>(
        `${this.base}/pages-spec/${pageSpecNom}/champs`
      ).pipe(catchError(() => of([] as ChampSpec[]))),
    });
  }

  // ── Model management (delegates to SearchService) ───────────────────────

  getModels(): Observable<SearchModel[]> {
    return this.searchSvc.getModels().pipe(
      map(models => models.filter(m => m.type === 'courriers'))
    );
  }

  saveModel(body: Partial<SearchModel>): Observable<SearchModel> {
    return this.searchSvc.createModel({ ...body, type: 'courriers' });
  }

  deleteModel(id: number): Observable<void> {
    return this.searchSvc.deleteModel(id);
  }
}
