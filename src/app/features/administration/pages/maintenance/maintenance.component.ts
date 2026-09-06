import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpParams } from '@angular/common/http';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdministrationService } from '../../services/administration.service';
import type { LogEntry } from '../../models/administration.models';

@Component({
  selector: 'pli-maintenance',
  standalone: true,
  imports: [
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzDrawerModule,
    NzTagModule,
    NzPopconfirmModule,
  ],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
})
export class MaintenanceComponent implements OnInit {
  private readonly service = inject(AdministrationService);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<LogEntry[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly selectedEntry = signal<LogEntry | null>(null);

  // Filter models
  protected dateRange: [Date, Date] | null = null;
  protected filterType = '';
  protected filterMachine = '';
  protected filterUser = '';
  protected filterObjet = '';

  protected readonly typeOptions = [
    { value: '',    label: 'Tous les types' },
    { value: 'CON', label: 'CON — Connexion' },
    { value: 'FON', label: 'FON — Fonctionnel' },
    { value: 'ERR', label: 'ERR — Erreur' },
  ];

  ngOnInit(): void {
    this.search();
  }

  protected search(): void {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (this.dateRange?.[0]) params = params.set('dateDebut', this.dateRange[0].toISOString().split('T')[0]);
    if (this.dateRange?.[1]) params = params.set('dateFin', this.dateRange[1].toISOString().split('T')[0]);
    if (this.filterType) params = params.set('type', this.filterType);
    if (this.filterMachine) params = params.set('machine', this.filterMachine);
    if (this.filterUser) params = params.set('utilisateur', this.filterUser);
    if (this.filterObjet) params = params.set('objet', this.filterObjet);

    this.service.getLogs(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.items.set(data); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  protected reset(): void {
    this.dateRange = null;
    this.filterType = '';
    this.filterMachine = '';
    this.filterUser = '';
    this.filterObjet = '';
    this.search();
  }

  protected openDetail(entry: LogEntry): void {
    this.selectedEntry.set(entry);
    this.drawerVisible.set(true);
  }

  protected confirmDelete(id: number): void {
    this.service.deleteLog(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Entrée supprimée.'); this.search(); },
        error: () => this.msg.error('Impossible de supprimer cette entrée.'),
      });
  }

  protected getTypeColor(type: string): string {
    const map: Record<string, string> = { CON: 'processing', FON: 'warning', ERR: 'error' };
    return map[type] ?? 'default';
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR');
  }
}
