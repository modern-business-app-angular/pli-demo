import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { EnvironmentService } from '../../../core/config/environment.service';
import type {
  Demande,
  DemandeFilters,
  TraiterPayload,
  RepondrePayload,
  PullResult,
} from '../models/demande.model';

@Injectable({ providedIn: 'root' })
export class DemandesService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  private get base(): string {
    return this.env.apiBaseUrl;
  }

  getList(filters: DemandeFilters = {}): Observable<Demande[]> {
    let params = new HttpParams();
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<Demande[]>(`${this.base}/demandes`, { params });
  }

  getById(id: number): Observable<Demande> {
    return this.http.get<Demande>(`${this.base}/demandes/${id}`);
  }

  pullFromPop(): Observable<PullResult> {
    return this.http.post<PullResult>(`${this.base}/demandes/pull-pop`, {});
  }

  traiter(payload: TraiterPayload): Observable<Demande> {
    return this.http.put<Demande>(
      `${this.base}/demandes/${payload.demandeId}/traiter`,
      payload
    );
  }

  repondre(payload: RepondrePayload): Observable<Demande> {
    return this.http.put<Demande>(
      `${this.base}/demandes/${payload.demandeId}/repondre`,
      payload
    );
  }
}
