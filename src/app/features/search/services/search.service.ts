import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { EnvironmentService } from '../../../core/config/environment.service';
import type { SearchModel } from '../models/search.models';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(EnvironmentService);

  private get base(): string {
    return this.env.apiBaseUrl;
  }

  getModels(): Observable<SearchModel[]> {
    return this.http.get<SearchModel[]>(`${this.base}/search-models`);
  }

  createModel(body: Partial<SearchModel>): Observable<SearchModel> {
    return this.http.post<SearchModel>(`${this.base}/search-models`, body);
  }

  updateModel(id: number, body: Partial<SearchModel>): Observable<SearchModel> {
    return this.http.put<SearchModel>(`${this.base}/search-models/${id}`, body);
  }

  deleteModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/search-models/${id}`);
  }
}
