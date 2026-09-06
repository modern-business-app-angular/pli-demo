import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { EnvironmentService } from '../../../core/config/environment.service';
import type { Ville, Personnel, ServiceCodif, Service, Chrono, TerritoireNiveau, TerritoireElement, Sectorisation } from '../models/codification.models';

@Injectable({ providedIn: 'root' })
export class CodificationsService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  private get base(): string {
    return this.env.apiBaseUrl;
  }

  // ── Generic CRUD ─────────────────────────────────────────────────────────

  list<T>(endpoint: string, params?: HttpParams): Observable<T[]> {
    return this.http.get<T[]>(`${this.base}${endpoint}`, params ? { params } : {});
  }

  create<T>(endpoint: string, body: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.base}${endpoint}`, body);
  }

  update<T>(endpoint: string, id: number | string, body: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.base}${endpoint}/${id}`, body);
  }

  delete(endpoint: string, id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}${endpoint}/${id}`);
  }

  // ── Typed helpers (needed by configs with asyncOptions) ─────────────────

  /** Used by Rues config to populate the Ville select */
  getVilles(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${this.base}/villes`);
  }

  // ── Personnel ─────────────────────────────────────────────────────────────

  getPersonnels(): Observable<Personnel[]> {
    return this.http.get<Personnel[]>(`${this.base}/personnels`);
  }

  createPersonnel(body: Partial<Personnel>): Observable<Personnel> {
    return this.http.post<Personnel>(`${this.base}/personnels`, body);
  }

  updatePersonnel(id: number, body: Partial<Personnel>): Observable<Personnel> {
    return this.http.put<Personnel>(`${this.base}/personnels/${id}`, body);
  }

  deletePersonnel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/personnels/${id}`);
  }

  // ── Stats (single request for all codification counts) ───────────────────

  getCodifStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.base}/codifications/stats`);
  }

  // ── Services ──────────────────────────────────────────────────────────────

  getServices(): Observable<ServiceCodif[]> {
    return this.http.get<ServiceCodif[]>(`${this.base}/services`);
  }

  createService(body: Partial<Service>): Observable<Service> {
    return this.http.post<Service>(`${this.base}/services`, body);
  }

  updateService(id: number, body: Partial<Service>): Observable<Service> {
    return this.http.put<Service>(`${this.base}/services/${id}`, body);
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/services/${id}`);
  }

  testMailConnection(type: 'pop' | 'smtp', config: Record<string, string>): Observable<void> {
    return this.http.post<void>(`${this.base}/personnels/test-mail`, { type, ...config });
  }

  // ── Chronos ───────────────────────────────────────────────────────────────

  getChronos(): Observable<Chrono[]> {
    return this.http.get<Chrono[]>(`${this.base}/chronos`);
  }

  createChrono(body: Partial<Chrono>): Observable<Chrono> {
    return this.http.post<Chrono>(`${this.base}/chronos`, body);
  }

  updateChrono(id: number, body: Partial<Chrono>): Observable<Chrono> {
    return this.http.put<Chrono>(`${this.base}/chronos/${id}`, body);
  }

  deleteChrono(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/chronos/${id}`);
  }

  // ── Territoires ───────────────────────────────────────────────────────────

  getTerritoireNiveaux(): Observable<TerritoireNiveau[]> {
    return this.http.get<TerritoireNiveau[]>(`${this.base}/territoire-niveaux`);
  }

  renameTerritoireNiveau(niveau: number, nom: string): Observable<TerritoireNiveau> {
    return this.http.patch<TerritoireNiveau>(`${this.base}/territoire-niveaux/${niveau}`, { nom });
  }

  getTerritoireElements(niveau: number): Observable<TerritoireElement[]> {
    const params = new HttpParams().set('niveau', niveau);
    return this.http.get<TerritoireElement[]>(`${this.base}/territoire-elements`, { params });
  }

  createTerritoireElement(body: Partial<TerritoireElement>): Observable<TerritoireElement> {
    return this.http.post<TerritoireElement>(`${this.base}/territoire-elements`, body);
  }

  updateTerritoireElement(id: number, body: Partial<TerritoireElement>): Observable<TerritoireElement> {
    return this.http.put<TerritoireElement>(`${this.base}/territoire-elements/${id}`, body);
  }

  deleteTerritoireElement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/territoire-elements/${id}`);
  }

  // ── Sectorisation ─────────────────────────────────────────────────────────

  getSectorisations(): Observable<Sectorisation[]> {
    return this.http.get<Sectorisation[]>(`${this.base}/sectorisations`);
  }

  createSectorisation(body: Partial<Sectorisation>): Observable<Sectorisation> {
    return this.http.post<Sectorisation>(`${this.base}/sectorisations`, body);
  }

  updateSectorisation(id: number, body: Partial<Sectorisation>): Observable<Sectorisation> {
    return this.http.put<Sectorisation>(`${this.base}/sectorisations/${id}`, body);
  }

  deleteSectorisation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/sectorisations/${id}`);
  }

  affecterAdresses(niveau: number, updateAll: boolean): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(
      `${this.base}/territoire-niveaux/${niveau}/affecter-adresses`,
      { updateAll }
    );
  }
}
