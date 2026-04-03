import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export type AuthTab = 'login' | 'signup';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal<AuthTab>('login');
  readonly showPasswordLogin = signal(false);
  readonly showPasswordSignup = signal(false);
  readonly loading = this.auth.loading;
  readonly returnUrl = signal('/dashboard');

  // 🔥 LOGIN FORM (CORRECT)
  readonly loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // 🔥 SIGNUP FORM (BACKEND MATCHED)
  readonly signupForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  setTab(tab: AuthTab): void {
    this.activeTab.set(tab);
  }

  constructor() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (returnUrl) this.returnUrl.set(returnUrl);
    if (reason === 'history') {
      this.toast.show('Login to view your history');
    }
  }

  // 🔥 LOGIN (FINAL)
  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();

    void this.auth.login(username, password, this.returnUrl()).catch(() => {});
  }

  // 🔥 SIGNUP
  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const v = this.signupForm.getRawValue();
    void this.auth.signup({
      fullName: v.fullName,
      email: v.email,
      password: v.password,
      mobile: v.mobile,
    }).catch(() => {});
  }
}