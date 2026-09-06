import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { UiStore } from '../../state/ui.store';
import { AuthStore } from '../../state/auth.store';
import { AuthService } from '../../core/services/auth.service';
import { DemoUiService } from '../../core/demo/demo-ui.service';

@Component({
  selector: 'pli-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NzDropDownModule, NzMenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly uiStore   = inject(UiStore);
  protected readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  protected readonly demo = inject(DemoUiService);

  protected readonly isCollapsed   = computed(() => this.uiStore.sidebarCollapsed());
  protected readonly serviceOpen   = signal(true);
  protected readonly courriersOpen = signal(true);
  protected readonly protocoleOpen = signal(false);
  protected readonly adminOpen     = signal(false);

  protected toggleService(): void {
    if (!this.isCollapsed()) this.serviceOpen.update((v) => !v);
  }

  protected toggleCourriers(): void {
    if (!this.isCollapsed()) this.courriersOpen.update((v) => !v);
  }

  protected toggleProtocole(): void {
    if (!this.isCollapsed()) this.protocoleOpen.update((v) => !v);
  }

  protected toggleAdmin(): void {
    if (!this.isCollapsed()) this.adminOpen.update((v) => !v);
  }

  protected toggleSidebar(): void {
    this.uiStore.toggleSidebar();
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected openCommandPalette(): void {
    window.dispatchEvent(new CustomEvent('pli:open-cmd'));
  }
}
