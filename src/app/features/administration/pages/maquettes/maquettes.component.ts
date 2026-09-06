import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdministrationService } from '../../services/administration.service';
import type { Maquette } from '../../models/administration.models';
import { TagConfigDrawerComponent } from './tag-config/tag-config-drawer.component';

const TYPE_LABELS: Record<string, string> = {
  AR: 'Accusé de réception',
  REP: 'Réponse',
  ML: 'Mailing',
  BOR: 'Bordereau',
};

const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.dotx', '.odt'];

@Component({
  selector: 'pli-maquettes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzRadioModule,
    NzPopconfirmModule,
    NzTagModule,
    NzIconModule,
    TagConfigDrawerComponent,
  ],
  templateUrl: './maquettes.component.html',
  styleUrl: './maquettes.component.scss',
})
export class MaquettesComponent implements OnInit {
  private readonly service = inject(AdministrationService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  protected readonly items = signal<Maquette[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly modalVisible = signal(false);
  protected readonly editingItem = signal<Maquette | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly currentFilename = signal<string | null>(null);
  protected readonly configuringMaquette = signal<Maquette | null>(null);
  protected readonly tagConfigVisible = signal(false);

  protected searchModel = '';
  private readonly search$ = new Subject<string>();

  protected readonly typeOptions = [
    { value: 'AR',  label: 'Accusé de réception' },
    { value: 'REP', label: 'Réponse' },
    { value: 'ML',  label: 'Mailing' },
    { value: 'BOR', label: 'Bordereau' },
  ];

  protected readonly accesOptions = [
    { value: 'PUBLIC',  label: 'Public' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'USER',    label: 'Personnel' },
  ];

  protected form = this.fb.group({
    nom:   ['', [Validators.required, Validators.maxLength(250)]],
    type:  ['AR' as Maquette['type'], Validators.required],
    acces: ['PUBLIC' as Maquette['acces'], Validators.required],
  });

  ngOnInit(): void {
    this.loadData();
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyFilter());
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getMaquettes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.items.set(data); this.isLoading.set(false); },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });
  }

  private applyFilter(): void {
    const q = this.searchModel.trim().toLowerCase();
    if (!q) { this.loadData(); return; }
    this.isLoading.set(true);
    this.service.getMaquettes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.items.set(data.filter((m) => m.nom.toLowerCase().includes(q)));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  protected onSearch(v: string): void { this.search$.next(v); }

  protected openAdd(): void {
    this.editingItem.set(null);
    this.selectedFile.set(null);
    this.currentFilename.set(null);
    this.form.reset({ nom: '', type: 'AR', acces: 'PUBLIC' });
    this.modalVisible.set(true);
  }

  protected openEdit(item: Maquette): void {
    this.editingItem.set(item);
    this.selectedFile.set(null);
    this.currentFilename.set(item.filename ?? null);
    this.form.patchValue({ nom: item.nom, type: item.type, acces: item.acces });
    this.modalVisible.set(true);
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      this.msg.warning(`Format non supporté. Formats acceptés : ${ALLOWED_EXTENSIONS.join(', ')}`);
      input.value = '';
      return;
    }
    this.selectedFile.set(file);
  }

  protected clearFile(): void {
    this.selectedFile.set(null);
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  protected saveModal(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const editing = this.editingItem();
    // Require file on create
    if (!editing && !this.selectedFile()) {
      this.msg.warning('Veuillez sélectionner un fichier de maquette.');
      return;
    }
    this.isSaving.set(true);
    const body: Partial<Maquette> = {
      nom:   this.form.value.nom   ?? '',
      type:  this.form.value.type  as Maquette['type'],
      acces: this.form.value.acces as Maquette['acces'],
    };
    const file = this.selectedFile() ?? undefined;
    const obs = editing
      ? this.service.updateMaquette(editing.id, body, file)
      : this.service.createMaquette(body, file);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.modalVisible.set(false);
        this.msg.success(editing ? 'Maquette modifiée.' : 'Maquette ajoutée.');
        this.loadData();
      },
      error: () => { this.isSaving.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
    });
  }

  protected previewMaquette(item: Maquette): void {
    // The file is served by the in-browser API: fetch it as a Blob and trigger a download.
    this.service.getMaquetteFile(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `${item.nom}${item.extension || '.docx'}`;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          this.msg.success('Maquette téléchargée.');
        },
        error: () => this.msg.error('Aucun fichier disponible pour cette maquette.'),
      });
  }

  protected duplicate(item: Maquette): void {
    this.service.duplicateMaquette(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Maquette dupliquée.'); this.loadData(); },
        error: () => this.msg.error('Erreur lors de la duplication.'),
      });
  }

  protected confirmDelete(id: number): void {
    this.service.deleteMaquette(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.msg.success('Maquette supprimée.'); this.loadData(); },
        error: () => this.msg.error('Impossible de supprimer cette maquette.'),
      });
  }

  protected openTagConfig(item: Maquette): void {
    this.configuringMaquette.set(item);
    this.tagConfigVisible.set(true);
  }

  protected getTypeLabel(type: string): string { return TYPE_LABELS[type] ?? type; }

  protected getAccesColor(acces: string): string {
    return acces === 'PUBLIC' ? 'success' : acces === 'SERVICE' ? 'processing' : 'default';
  }

  protected get modalVisibleModel(): boolean { return this.modalVisible(); }
  protected set modalVisibleModel(v: boolean) { this.modalVisible.set(v); }
}
