import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzProgressModule } from 'ng-zorro-antd/progress';

export interface RecentCourrier {
  id: number;
  numeroChrono: string;
  objet: string;
  expediteur: string;
  organisme: string;
  statut: 'E' | 'T' | 'F' | 'C';
  dateArrivee: Date;
  assigneNom: string;
  assigneInitiales: string;
  assigneColor: string;
  urgent: boolean;
}

export interface AlertItem {
  type: 'retard' | 'urgent' | 'ar_manquant' | 'nouveau';
  label: string;
  count: number;
  color: string;
  route: string;
}

export interface ActivityItem {
  user: string;
  initiales: string;
  color: string;
  action: string;
  cible: string;
  time: string;
}

@Component({
  selector: 'pli-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, NzAvatarModule, NzTableModule, NzTooltipModule, NzProgressModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {

  readonly today = new Date();

  // ── Stats ─────────────────────────────────────────────────────────────────
  readonly stats = [
    {
      label: 'Ma boîte de réception',
      value: 10,
      trend: +12,
      icon: 'shield',
      color: 'amber',
      route: '/dashboard',
      detail: 'courriers à traiter',
    },
    {
      label: 'Courriers en retard',
      value: 2,
      trend: -1,
      icon: 'clock',
      color: 'red',
      route: '/dashboard',
      detail: 'délai dépassé',
    },
    {
      label: 'Traités aujourd\'hui',
      value: 3,
      trend: +3,
      icon: 'check',
      color: 'green',
      route: '/dashboard',
      detail: 'transmis ou clôturés',
    },
    {
      label: 'En cours — service',
      value: 6,
      trend: +8,
      icon: 'activity',
      color: 'blue',
      route: '/courriers/entrant',
      detail: 'total Direction Générale',
    },
  ];

  // ── Module counters ────────────────────────────────────────────────────────
  readonly moduleStats = [
    { label: 'Demandes',        value: 10,   route: '/demandes',          color: 'tw-text-violet-600' },
    { label: 'Internes sans AR', value: 3,   route: '/courriers/interne', color: 'tw-text-amber-600' },
    { label: 'Entrants service', value: 10,  route: '/courriers/entrant', color: 'tw-text-blue-600' },
    { label: 'Numérisations',    value: 4,   route: '/demandes',          color: 'tw-text-gray-600' },
  ];

  // ── Recent courriers ────────────────────────────────────────────────────────
  readonly recentCourriers: RecentCourrier[] = [
    {
      id: 1,
      numeroChrono: 'REC-2026-0001',
      objet: 'Demande de subvention pour rénovation bâtiment',
      expediteur: 'Dupont',
      organisme: 'Mairie de Lyon',
      statut: 'E',
      dateArrivee: new Date('2026-03-18'),
      assigneNom: 'Marie Dumont',
      assigneInitiales: 'MD',
      assigneColor: '#1677ff',
      urgent: true,
    },
    {
      id: 2,
      numeroChrono: 'REC-2026-0002',
      objet: 'Réclamation concernant les nuisances sonores rue de la Paix',
      expediteur: 'Leblanc',
      organisme: '',
      statut: 'T',
      dateArrivee: new Date('2026-03-17'),
      assigneNom: 'Thomas Petit',
      assigneInitiales: 'TP',
      assigneColor: '#722ed1',
      urgent: false,
    },
    {
      id: 3,
      numeroChrono: 'DG-2026-0001',
      objet: 'Invitation colloque national des directeurs généraux',
      expediteur: 'ADGCF',
      organisme: 'Association des DGS',
      statut: 'T',
      dateArrivee: new Date('2026-03-16'),
      assigneNom: 'Marie Dumont',
      assigneInitiales: 'MD',
      assigneColor: '#1677ff',
      urgent: false,
    },
    {
      id: 4,
      numeroChrono: 'REC-2026-0003',
      objet: 'Demande permis de construire — Lot 12 ZAC des Granges',
      expediteur: 'Martin',
      organisme: 'Cabinet Martin & Associés',
      statut: 'F',
      dateArrivee: new Date('2026-03-15'),
      assigneNom: 'Lucie Fontaine',
      assigneInitiales: 'LF',
      assigneColor: '#52c41a',
      urgent: false,
    },
    {
      id: 5,
      numeroChrono: 'URG-2026-0001',
      objet: 'Mise en demeure — Contrôle sanitaire restaurant scolaire',
      expediteur: 'ARS Auvergne-Rhône',
      organisme: 'ARS AURA',
      statut: 'E',
      dateArrivee: new Date('2026-03-18'),
      assigneNom: 'Marie Dumont',
      assigneInitiales: 'MD',
      assigneColor: '#1677ff',
      urgent: true,
    },
    {
      id: 6,
      numeroChrono: 'REC-2026-0004',
      objet: 'Convention de partenariat culturel 2026-2028',
      expediteur: 'Grand Lyon Métropole',
      organisme: 'Grand Lyon Métropole',
      statut: 'T',
      dateArrivee: new Date('2026-03-14'),
      assigneNom: 'Claire Rousseau',
      assigneInitiales: 'CR',
      assigneColor: '#fa8c16',
      urgent: false,
    },
    {
      id: 7,
      numeroChrono: 'ELU-2026-0001',
      objet: 'Interpellation sur la politique de stationnement en centre-ville',
      expediteur: 'Morel',
      organisme: 'Mairie de Caluire',
      statut: 'C',
      dateArrivee: new Date('2026-03-13'),
      assigneNom: 'Marie Dumont',
      assigneInitiales: 'MD',
      assigneColor: '#1677ff',
      urgent: false,
    },
  ];

  // ── Activity feed ──────────────────────────────────────────────────────────
  readonly activity: ActivityItem[] = [
    { user: 'Marie Dumont',   initiales: 'MD', color: '#1677ff', action: 'a transmis',  cible: 'REC-2026-0001', time: 'Il y a 8 min' },
    { user: 'Thomas Petit',   initiales: 'TP', color: '#722ed1', action: 'a clôturé',   cible: 'REC-2026-0002', time: 'Il y a 23 min' },
    { user: 'Lucie Fontaine', initiales: 'LF', color: '#52c41a', action: 'a répondu à', cible: 'REC-2026-0003', time: 'Il y a 1h' },
    { user: 'Claire Rousseau',initiales: 'CR', color: '#fa8c16', action: 'a créé',       cible: 'URG-2026-0001', time: 'Il y a 2h' },
    { user: 'Antoine Girard', initiales: 'AG', color: '#13c2c2', action: 'a transmis',  cible: 'DG-2026-0001',  time: 'Il y a 3h' },
    { user: 'Marie Dumont',   initiales: 'MD', color: '#1677ff', action: 'a créé',       cible: 'REC-2026-0005', time: 'Hier 16h42' },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  readonly statutLabel: Record<string, string> = {
    E: 'En cours',
    T: 'Transmis',
    F: 'Terminé',
    C: 'Clôturé',
  };

  readonly statutCls: Record<string, string> = {
    E: 'dash-badge--blue',
    T: 'dash-badge--green',
    F: 'dash-badge--gray',
    C: 'dash-badge--red',
  };

  trendLabel(n: number): string {
    return n > 0 ? `+${n} vs hier` : `${n} vs hier`;
  }
}
