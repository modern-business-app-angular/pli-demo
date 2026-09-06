import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdministrationService } from '../../../services/administration.service';
import { TagCatalogService } from '../../../services/tag-catalog.service';
import { DocxTagParserService } from '../../../services/docx-tag-parser.service';
import type { Maquette, TagCatalog, TagCategory, TagDefinition, DocxParseResult } from '../../../models/administration.models';

const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.dotx', '.odt'];

/** Per-category accent colors for the dark sidebar panel. */
const CAT_ACCENTS: Record<string, string> = {
  correspondant: '#818cf8',  // indigo
  courrier:      '#38bdf8',  // sky
  service:       '#fbbf24',  // amber
  signataire:    '#f472b6',  // pink
  organisation:  '#34d399',  // emerald
  dates:         '#a78bfa',  // violet
};

@Component({
  selector: 'pli-tag-config-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzDrawerModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzCollapseModule,
    NzTagModule,
    NzAlertModule,
    NzSpinModule,
  ],
  templateUrl: './tag-config-drawer.component.html',
  styleUrl: './tag-config-drawer.component.scss',
})
export class TagConfigDrawerComponent implements OnChanges, OnDestroy {
  @Input() maquette: Maquette | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly adminService   = inject(AdministrationService);
  private readonly catalogService = inject(TagCatalogService);
  private readonly parserService  = inject(DocxTagParserService);
  private readonly msg            = inject(NzMessageService);
  private readonly destroyRef     = inject(DestroyRef);

  // ── State ─────────────────────────────────────────────────────────────────
  protected readonly catalog           = signal<TagCatalog | null>(null);
  protected readonly isLoadingCatalog  = signal(false);
  protected readonly searchQuery       = signal('');
  protected readonly parseResult       = signal<DocxParseResult>({ status: 'idle', foundTags: [], detectedMode: 'none' });
  protected readonly lastModified      = signal<string | null>(null);
  protected readonly wordOpenedAt      = signal<Date | null>(null);
  protected readonly reuploadFile      = signal<File | null>(null);
  /** Key of the last copied tag button — e.g. "Nom-merge" or "Nom-mustache". */
  protected readonly copiedTagKey      = signal<string | null>(null);
  /** Which tag syntax the catalog shows: «MERGE» or {{mustache}}. */
  protected readonly catalogMode       = signal<'merge' | 'mustache'>('merge');
  /** Set of category IDs that are currently expanded in the custom accordion. */
  protected readonly expandedCats      = signal<Set<string>>(new Set(['correspondant', 'courrier']));

  protected readonly drawerTitle = computed(() =>
    this.maquette ? `Configurer les balises — ${this.maquette.nom}` : 'Configurer les balises'
  );

  protected readonly filteredCategories = computed<TagCategory[]>(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const cat = this.catalog();
    if (!cat) return [];
    if (!q)   return cat.categories;
    return cat.categories
      .map((c) => ({
        ...c,
        tags: c.tags.filter(
          (t) => t.name.toLowerCase().includes(q) || t.label.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.tags.length > 0);
  });

  protected readonly allCatalogNames = computed<Set<string>>(() => {
    const cat = this.catalog();
    if (!cat) return new Set();
    return new Set(cat.categories.flatMap((c) => c.tags.map((t) => t.name)));
  });

  protected readonly validTags = computed(() =>
    this.parseResult().foundTags.filter((n) => this.allCatalogNames().has(n))
  );
  protected readonly unknownTags = computed(() =>
    this.parseResult().foundTags.filter((n) => !this.allCatalogNames().has(n))
  );
  protected readonly unusedTags = computed(() => {
    const found = new Set(this.parseResult().foundTags);
    return [...this.allCatalogNames()].filter((n) => !found.has(n));
  });

  protected readonly wordStatusLabel = computed(() => {
    const lm     = this.lastModified();
    const opened = this.wordOpenedAt();
    if (!lm || !opened) return null;
    const modDate = new Date(lm);
    if (modDate > opened) {
      const diffMin = Math.round((Date.now() - modDate.getTime()) / 60000);
      return diffMin <= 0 ? 'À l\'instant' : `Il y a ${diffMin} min`;
    }
    return null;
  });

  // ── Polling ───────────────────────────────────────────────────────────────
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(): void {
    if (this.visible && this.maquette) {
      this._loadCatalog();
      this._loadLastParsedTags();
    }
    if (!this.visible) {
      this._stopPolling();
    }
  }

  ngOnDestroy(): void {
    this._stopPolling();
  }

  // ── Catalog ───────────────────────────────────────────────────────────────
  private _loadCatalog(): void {
    if (this.catalog()) return;
    this.isLoadingCatalog.set(true);
    this.catalogService.buildCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => { this.catalog.set(c); this.isLoadingCatalog.set(false); },
        error: () => {
          this.catalog.set(this.catalogService.getSystemCatalog());
          this.isLoadingCatalog.set(false);
        },
      });
  }

  private _loadLastParsedTags(): void {
    const id = this.maquette?.id;
    if (!id) return;
    this.adminService.getMaquetteTags(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          if (cfg.lastFoundTags?.length) {
            this.parseResult.set({ status: 'done', foundTags: cfg.lastFoundTags, detectedMode: 'mergefield' });
          }
        },
        error: () => { /* first-time — no saved state yet */ },
      });
  }

  // ── Copy helpers ──────────────────────────────────────────────────────────
  protected copyMergeField(tag: TagDefinition): void {
    navigator.clipboard.writeText(tag.mergeField).then(() => {
      this.copiedTagKey.set(`${tag.name}-merge`);
      setTimeout(() => this.copiedTagKey.set(null), 1300);
      this.msg.success(`Copié : ${tag.mergeField}`, { nzDuration: 1500 });
    });
  }

  protected copyMustache(tag: TagDefinition): void {
    navigator.clipboard.writeText(tag.mustache).then(() => {
      this.copiedTagKey.set(`${tag.name}-mustache`);
      setTimeout(() => this.copiedTagKey.set(null), 1300);
      this.msg.success(`Copié : ${tag.mustache}`, { nzDuration: 1500 });
    });
  }

  // ── Word open ─────────────────────────────────────────────────────────────
  protected openInWord(): void {
    // Demo build: no WebDAV server nor desktop Word available — explain instead of failing silently.
    this.msg.warning(
      'Nécessite Microsoft Word et un serveur WebDAV — indisponible dans cette démo. Utilisez « Analyser le document » pour lire les champs de fusion dans le navigateur.',
      { nzDuration: 5000 }
    );
  }

  private _stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // ── CSV download ──────────────────────────────────────────────────────────
  protected downloadCatalogCsv(): void {
    this.adminService.getCatalogDatasourceCsv()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (csv) => {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'pli-catalog.csv';
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: () => this.msg.error('Impossible de télécharger le catalogue CSV.'),
      });
  }

  // ── Tag analysis ──────────────────────────────────────────────────────────
  protected analyzeDocument(): void {
    const id = this.maquette?.id;
    if (!id) return;
    this.parseResult.set({ status: 'parsing', foundTags: [], detectedMode: 'none' });
    this.adminService.getMaquetteFile(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (blob) => {
          const result = await this.parserService.parseFile(blob);
          this.parseResult.set(result);
          if (result.status === 'done') this._persistTags(result.foundTags);
        },
        error: () => this.parseResult.set({
          status: 'error', foundTags: [], detectedMode: 'none',
          errorMessage: 'Impossible de télécharger le fichier.',
        }),
      });
  }

  private _persistTags(foundTags: string[]): void {
    const id = this.maquette?.id;
    if (!id) return;
    this.adminService.saveMaquetteTags(id, { lastFoundTags: foundTags, lastParsedAt: new Date().toISOString() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  // ── Fallback download ─────────────────────────────────────────────────────
  protected downloadFallback(): void {
    const id = this.maquette?.id;
    if (!id) return;
    this.adminService.getMaquetteFile(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url    = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href  = url;
          anchor.download = `maquette-${this.maquette?.nom ?? id}.docx`;
          anchor.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.msg.error('Téléchargement impossible.'),
      });
  }

  // ── Fallback upload ───────────────────────────────────────────────────────
  protected onReuploadChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    if (!file) return;
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      this.msg.warning(`Format non supporté. Formats acceptés : ${ALLOWED_EXTENSIONS.join(', ')}`);
      input.value = '';
      return;
    }
    this.reuploadFile.set(file);
    this._analyzeUploadedFile(file);
  }

  private async _analyzeUploadedFile(file: File): Promise<void> {
    this.parseResult.set({ status: 'parsing', foundTags: [], detectedMode: 'none' });
    const result = await this.parserService.parseFile(file);
    this.parseResult.set(result);
    if (result.status === 'done') this._persistTags(result.foundTags);
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  protected close(): void {
    this._stopPolling();
    this.visibleChange.emit(false);
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  protected catAccent(catId: string): string {
    if (catId.startsWith('dynamic-')) return '#94a3b8';
    return CAT_ACCENTS[catId] ?? '#818cf8';
  }

  protected detectModeBadge(mode: DocxParseResult['detectedMode']): string {
    switch (mode) {
      case 'mergefield': return 'MERGEFIELD';
      case 'mustache':   return '{{Mustache}}';
      case 'mixed':      return 'Mixte';
      default:           return 'Aucun';
    }
  }

  protected detectModeColor(mode: DocxParseResult['detectedMode']): string {
    switch (mode) {
      case 'mergefield': return 'processing';
      case 'mustache':   return 'default';
      case 'mixed':      return 'warning';
      default:           return 'default';
    }
  }

  protected isExpanded(index: number): boolean { return index < 2; }

  // ── Custom accordion ──────────────────────────────────────────────────────
  protected isCatExpanded(catId: string): boolean {
    return this.expandedCats().has(catId);
  }

  protected toggleCat(catId: string): void {
    const current = new Set(this.expandedCats());
    if (current.has(catId)) {
      current.delete(catId);
    } else {
      current.add(catId);
    }
    this.expandedCats.set(current);
  }

  /** Copy the tag syntax matching the current catalog mode. */
  protected copyTag(tag: TagDefinition): void {
    if (this.catalogMode() === 'merge') {
      this.copyMergeField(tag);
    } else {
      this.copyMustache(tag);
    }
  }
}
