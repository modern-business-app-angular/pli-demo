import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DemoUiService } from '../../../core/demo/demo-ui.service';

interface PaletteItem {
  group: string;
  label: string;
  icon: string;
  route?: string;
  kbd?: string;
  action?: () => void;
}

@Component({
  selector: 'pli-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  protected readonly isOpen = signal(false);
  protected readonly query = signal('');

  private readonly router = inject(Router);
  private readonly demo = inject(DemoUiService);

  private readonly allItems: PaletteItem[] = [
    { group: 'Créer', label: 'Nouveau courrier entrant', icon: 'mail', route: '/courriers/entrant/nouveau', kbd: 'Ctrl+N' },
    { group: 'Créer', label: 'Nouveau courrier sortant', icon: 'send', route: '/courriers/sortant/nouveau' },
    { group: 'Naviguer', label: 'Tableau de bord', icon: 'grid', route: '/dashboard' },
    { group: 'Naviguer', label: 'Courriers entrants', icon: 'inbox', route: '/courriers/entrant' },
    { group: 'Naviguer', label: 'Courriers sortants', icon: 'send', route: '/courriers/sortant' },
    { group: 'Naviguer', label: 'Courriers internes', icon: 'mail', route: '/courriers/interne' },
    { group: 'Naviguer', label: 'Recherche avancée', icon: 'search', route: '/courriers/recherche' },
    { group: 'Naviguer', label: 'Demandes', icon: 'file', route: '/demandes' },
    { group: 'Naviguer', label: 'Codifications', icon: 'shield', route: '/parametres/codifications' },
    { group: 'Naviguer', label: 'Maquettes Word', icon: 'file', route: '/parametres/maquettes' },
    { group: 'Démo', label: 'À propos de cette démo', icon: 'users', action: () => this.demo.openAbout() },
  ];

  protected get filteredGroups(): { group: string; items: PaletteItem[] }[] {
    const q = this.query().toLowerCase().trim();
    const items = q
      ? this.allItems.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q))
      : this.allItems;

    const map = new Map<string, PaletteItem[]>();
    for (const item of items) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }

  ngOnInit(): void {
    window.addEventListener('pli:open-cmd', this.open);
  }

  ngOnDestroy(): void {
    window.removeEventListener('pli:open-cmd', this.open);
  }

  private readonly open = (): void => {
    this.isOpen.set(true);
    this.query.set('');
    // Focus the input after the next render cycle
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.cmd__input');
      input?.focus();
    }, 50);
  };

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected navigate(item: PaletteItem): void {
    this.close();
    if (item.route) {
      this.router.navigateByUrl(item.route);
    } else if (item.action) {
      item.action();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    }
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }
}
