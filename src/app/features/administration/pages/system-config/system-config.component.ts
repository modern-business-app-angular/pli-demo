import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdministrationService } from '../../services/administration.service';
import type { SystemConfig } from '../../models/administration.models';

@Component({
  selector: 'pli-system-config',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './system-config.component.html',
  styleUrl: './system-config.component.scss',
})
export class SystemConfigComponent implements OnInit {
  private readonly service = inject(AdministrationService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly isSavingStorage = signal(false);
  protected readonly isSavingLdap = signal(false);
  protected showAlfrescoFields = false;
  protected showLdapFields = false;

  protected storageForm = this.fb.group({
    mode:             ['interne' as 'interne' | 'alfresco'],
    alfrescoUrl:      [''],
    alfrescoLogin:    [''],
    alfrescoPassword: [''],
    alfrescoRoot:     [''],
  });

  protected ldapForm = this.fb.group({
    enabled:       [false],
    serverUrl:     [''],
    domain:        [''],
    adminLogin:    [''],
    adminPassword: [''],
  });

  // Track password visibility
  protected showStoragePwd = false;
  protected showLdapPwd = false;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.service.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cfg) => {
          this.storageForm.patchValue({
            mode:             cfg.storage.mode,
            alfrescoUrl:      cfg.storage.alfrescoUrl ?? '',
            alfrescoLogin:    cfg.storage.alfrescoLogin ?? '',
            alfrescoPassword: cfg.storage.alfrescoPassword ?? '',
            alfrescoRoot:     cfg.storage.alfrescoRoot ?? '',
          });
          this.ldapForm.patchValue({
            enabled:       cfg.ldap.enabled,
            serverUrl:     cfg.ldap.serverUrl ?? '',
            domain:        cfg.ldap.domain ?? '',
            adminLogin:    cfg.ldap.adminLogin ?? '',
            adminPassword: cfg.ldap.adminPassword ?? '',
          });
          this.showAlfrescoFields = cfg.storage.mode === 'alfresco';
          this.showLdapFields = cfg.ldap.enabled;
          this.isLoading.set(false);
        },
        error: () => { this.isLoading.set(false); this.msg.error('Erreur lors du chargement.'); },
      });

    this.storageForm.get('mode')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => { this.showAlfrescoFields = v === 'alfresco'; });

    this.ldapForm.get('enabled')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => { this.showLdapFields = !!v; });
  }

  protected saveStorage(): void {
    this.isSavingStorage.set(true);
    const current = this.buildCurrentConfig();
    const storage = this.storageForm.value;
    const body: SystemConfig = {
      ...current,
      storage: {
        mode: storage.mode as 'interne' | 'alfresco',
        alfrescoUrl:      storage.alfrescoUrl ?? undefined,
        alfrescoLogin:    storage.alfrescoLogin ?? undefined,
        alfrescoPassword: storage.alfrescoPassword ?? undefined,
        alfrescoRoot:     storage.alfrescoRoot ?? undefined,
      },
    };
    this.service.saveConfig(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.isSavingStorage.set(false); this.msg.success('Configuration stockage enregistrée.'); },
        error: () => { this.isSavingStorage.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
      });
  }

  protected saveLdap(): void {
    this.isSavingLdap.set(true);
    const current = this.buildCurrentConfig();
    const ldap = this.ldapForm.value;
    const body: SystemConfig = {
      ...current,
      ldap: {
        enabled:       !!ldap.enabled,
        serverUrl:     ldap.serverUrl ?? undefined,
        domain:        ldap.domain ?? undefined,
        adminLogin:    ldap.adminLogin ?? undefined,
        adminPassword: ldap.adminPassword ?? undefined,
      },
    };
    this.service.saveConfig(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.isSavingLdap.set(false); this.msg.success('Configuration LDAP enregistrée.'); },
        error: () => { this.isSavingLdap.set(false); this.msg.error('Erreur lors de l\'enregistrement.'); },
      });
  }

  private buildCurrentConfig(): SystemConfig {
    const s = this.storageForm.value;
    const l = this.ldapForm.value;
    return {
      storage: {
        mode: s.mode as 'interne' | 'alfresco',
        alfrescoUrl: s.alfrescoUrl ?? undefined,
        alfrescoLogin: s.alfrescoLogin ?? undefined,
        alfrescoPassword: s.alfrescoPassword ?? undefined,
        alfrescoRoot: s.alfrescoRoot ?? undefined,
      },
      ldap: {
        enabled: !!l.enabled,
        serverUrl: l.serverUrl ?? undefined,
        domain: l.domain ?? undefined,
        adminLogin: l.adminLogin ?? undefined,
        adminPassword: l.adminPassword ?? undefined,
      },
    };
  }
}
