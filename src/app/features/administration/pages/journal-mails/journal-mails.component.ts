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
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdministrationService } from '../../services/administration.service';
import type { MailLog } from '../../models/administration.models';

@Component({
  selector: 'pli-journal-mails',
  standalone: true,
  imports: [
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzDrawerModule,
  ],
  templateUrl: './journal-mails.component.html',
  styleUrl: './journal-mails.component.scss',
})
export class JournalMailsComponent implements OnInit {
  private readonly service = inject(AdministrationService);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<MailLog[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly drawerVisible = signal(false);
  protected readonly selectedMail = signal<MailLog | null>(null);

  protected dateRange: [Date, Date] | null = null;
  protected filterObjet = '';
  protected filterType = '';
  protected filterEmetteur = '';
  protected filterDestinataire = '';

  protected readonly typeOptions = [
    { value: '',   label: 'Tous les types' },
    { value: 'AR', label: 'AR — Accusé réception' },
    { value: 'RP', label: 'RP — Réponse' },
    { value: 'ML', label: 'ML — Mailing' },
    { value: 'BR', label: 'BR — Bordereau' },
  ];

  ngOnInit(): void {
    this.search();
  }

  protected search(): void {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (this.dateRange?.[0]) params = params.set('dateDebut', this.dateRange[0].toISOString().split('T')[0]);
    if (this.dateRange?.[1]) params = params.set('dateFin', this.dateRange[1].toISOString().split('T')[0]);
    if (this.filterObjet)        params = params.set('objet', this.filterObjet);
    if (this.filterType)         params = params.set('type', this.filterType);
    if (this.filterEmetteur)     params = params.set('emetteur', this.filterEmetteur);
    if (this.filterDestinataire) params = params.set('destinataire', this.filterDestinataire);

    this.service.getJournalMails(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.items.set(data); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  protected reset(): void {
    this.dateRange = null;
    this.filterObjet = '';
    this.filterType = '';
    this.filterEmetteur = '';
    this.filterDestinataire = '';
    this.search();
  }

  protected openDetail(mail: MailLog): void {
    this.selectedMail.set(mail);
    this.drawerVisible.set(true);
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR');
  }
}
