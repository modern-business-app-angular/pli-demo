import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../state/auth.store';
import { DemoUiService } from '../../../../core/demo/demo-ui.service';
import { DemoPersona } from '../../../../core/demo/demo.config';
import { DemoBadgeComponent } from '../../../../core/demo/demo-badge/demo-badge.component';
import { DemoPersonaBarComponent } from '../../../../core/demo/demo-persona-bar/demo-persona-bar.component';

@Component({
  selector: 'pli-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzAlertModule,
    NzIconModule,
    DemoBadgeComponent,
    DemoPersonaBarComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  protected readonly isLoading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly showPwd = signal(false);
  protected readonly form: FormGroup;

  protected readonly demo = inject(DemoUiService);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    const fb = inject(FormBuilder);
    this.form = fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  /** One-click login with a demo persona. */
  protected loginAs(persona: DemoPersona): void {
    this.form.setValue({ username: persona.username, password: persona.password });
    this.submit();
  }

  protected submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsDirty());
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.authStore.setLoading(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.authStore.setUser(response.user);
        this.authStore.setLoading(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg =
          err.status === 401
            ? 'Identifiant ou mot de passe incorrect.'
            : (err.error?.message ?? 'Erreur de connexion. Veuillez réessayer.');
        this.errorMsg.set(msg);
        this.isLoading.set(false);
        this.authStore.setLoading(false);
      },
    });
  }

  protected togglePassword(): void {
    this.showPwd.update((v) => !v);
  }
}
