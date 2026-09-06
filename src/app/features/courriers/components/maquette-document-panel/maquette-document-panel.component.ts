import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { QuillModule } from 'ngx-quill';
import { MaquetteSelectorModalComponent } from '../maquette-selector-modal/maquette-selector-modal.component';
import { CourriersService } from '../../services/courriers.service';
import type { DocumentLie, CreateCourrierRequest } from '../../models/courrier.model';
import type { Maquette } from '../../../administration/models/administration.models';

@Component({
  selector: 'pli-maquette-document-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzInputModule,
    NzTooltipModule,
    QuillModule,
  ],
  templateUrl: './maquette-document-panel.component.html',
  styleUrl: './maquette-document-panel.component.scss',
})
export class MaquetteDocumentPanelComponent {
  @Input() courrierSnapshot: Partial<CreateCourrierRequest> | null = null;
  @Output() documentsChange = new EventEmitter<DocumentLie[]>();

  private readonly modal = inject(NzModalService);
  private readonly service = inject(CourriersService);

  readonly documents = signal<DocumentLie[]>([]);
  readonly activeDocIdx = signal<number | null>(null);

  readonly quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  readonly typeLabel: Record<string, string> = { AR: 'Accusé de réception', REP: 'Réponse', BOR: 'Bordereau' };
  readonly typeColor: Record<string, string> = { AR: 'geekblue', REP: 'gold', BOR: 'cyan' };

  openSelector(type: 'AR' | 'REP' | 'BOR'): void {
    const ref = this.modal.create({
      nzTitle: `Sélectionner un modèle — ${this.typeLabel[type]}`,
      nzContent: MaquetteSelectorModalComponent,
      nzData: type,
      nzFooter: null,
      nzWidth: 600,
    });
    ref.afterClose.subscribe((maquette: Maquette | undefined) => {
      if (maquette) this.loadAndInitDocument(maquette, type);
    });
  }

  private loadAndInitDocument(maquette: Maquette, type: 'AR' | 'REP' | 'BOR'): void {
    this.service.getMaquettePreviewHtml(maquette.id).subscribe(result => {
      const html = this.prefillHtml(result.html);
      const doc: DocumentLie = {
        maquetteId: maquette.id,
        maquetteNom: maquette.nom,
        type,
        titre: maquette.nom,
        htmlContent: html,
      };
      const updated = [...this.documents(), doc];
      this.documents.set(updated);
      this.activeDocIdx.set(updated.length - 1);
      this.documentsChange.emit(updated);
    });
  }

  private prefillHtml(html: string): string {
    const snap = this.courrierSnapshot ?? {};
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dateEnreg = snap.dateArrivee
      ? new Date(snap.dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';
    const nom = (snap as Record<string, unknown>)['expediteurManuel']
      ? `${((snap as Record<string, unknown>)['expediteurManuel'] as Record<string, unknown>)['prenom'] ?? ''} ${((snap as Record<string, unknown>)['expediteurManuel'] as Record<string, unknown>)['nom'] ?? ''}`.trim()
      : '';

    return html
      .replace(/\{\{Objet\}\}/g, snap.objet ?? '')
      .replace(/\{\{DateDuJour\}\}/g, today)
      .replace(/\{\{DateEnregistrement\}\}/g, dateEnreg)
      .replace(/\{\{NomComplet\}\}/g, nom)
      .replace(/\{\{NumeroChrono\}\}/g, '')
      .replace(/\{\{Ville\}\}/g, '');
  }

  updateDocHtml(idx: number, html: string): void {
    const docs = [...this.documents()];
    docs[idx] = { ...docs[idx], htmlContent: html };
    this.documents.set(docs);
    this.documentsChange.emit(docs);
  }

  updateDocTitre(idx: number, titre: string): void {
    const docs = [...this.documents()];
    docs[idx] = { ...docs[idx], titre };
    this.documents.set(docs);
    this.documentsChange.emit(docs);
  }

  removeDoc(idx: number): void {
    const docs = this.documents().filter((_, i) => i !== idx);
    this.documents.set(docs);
    const active = this.activeDocIdx();
    if (active !== null && active >= docs.length) this.activeDocIdx.set(docs.length - 1);
    this.documentsChange.emit(docs);
  }
}
