import { Component, Input, Output, EventEmitter, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Router } from '@angular/router';
import { ROLES } from 'src/app/shared/constants/roles.constant';

@Component({
    selector: 'app-auth-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './auth-modal.component.html',
    styleUrls: ['./auth-modal.component.css'],
})
export class AuthModalComponent implements OnInit, OnDestroy {
    @Input() mode: 'login' | 'register' = 'login';
    @Output() close = new EventEmitter<void>();
    @Output() switchMode = new EventEmitter<'login' | 'register'>();

    private auth = inject(AuthService);
    private toast = inject(ToastService);
    private router = inject(Router);

    ngOnInit(): void {
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy(): void {
        document.body.style.overflow = '';
    }

    // ── Login ──────────────────────────────────────────
    loginForm = { username: '', password: '' };
    loginErrors = { username: '', password: '' };
    loginError = signal('');
    loginLoading = signal(false);
    showLoginPass = signal(false);

    // ── Forgot password ────────────────────────────────
    showForgot = signal(false);
    forgotEmail = '';
    forgotError = signal('');
    forgotLoading = signal(false);
    forgotSuccess = signal('');

    // ── Register ───────────────────────────────────────
    regForm = {
        name: '', email: '', phone: '',
        address: '', password: '', confirmPassword: '',
    };
    regErrors = {
        name: '', email: '', phone: '',
        address: '', password: '', confirmPassword: '',
    };
    regApiError = signal('');
    regSuccess = signal('');
    regLoading = signal(false);
    showRegPass = signal(false);
    showRegConfirm = signal(false);
    passwordStrength = signal(0);

    // ── Helpers ────────────────────────────────────────
    private emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private nameRe = /^[a-zA-Z][a-zA-Z\s.'-]{1,49}$/;

    switch(m: 'login' | 'register'): void {
        this.switchMode.emit(m);
    }

    onBackdropClick(e: MouseEvent): void {
        if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.close.emit();
        }
    }

    onForgotBackdrop(e: MouseEvent): void {
        if ((e.target as HTMLElement).classList.contains('forgot-overlay')) {
            this.showForgot.set(false);
        }
    }

    // ── Login validation ───────────────────────────────
    validateLogin(): boolean {
        let ok = true;

        this.loginErrors = {
            username: '',
            password: ''
        };

        const username = this.loginForm.username.trim();

        if (!username) {
            this.loginErrors.username = 'Email or phone number is required';
            ok = false;
        } else {
            const isEmail = this.emailRe.test(username);
            const isPhone = /^\d{10}$/.test(username);

            if (!isEmail && !isPhone) {
                this.loginErrors.username =
                    'Enter a valid email or 10-digit phone number';
                ok = false;
            }
        }

        if (!this.loginForm.password) {
            this.loginErrors.password = 'Password is required';
            ok = false;
        } else if (this.loginForm.password.length < 6) {
            this.loginErrors.password = 'Password is too short';
            ok = false;
        }

        return ok;
    }

    login(): void {
        if (!this.validateLogin()) return;
        this.loginLoading.set(true);
        this.loginError.set('');
        this.auth.login(this.loginForm).subscribe({
            next: (user) => {
                this.loginLoading.set(false);
                if (user.role === ROLES.NEW_USER) {
                    this.toast.error('Account not activated. Contact Admin.');
                    this.auth.logout();
                    return;
                }
                this.close.emit();
                this.auth.navigateByRole();
            },
            error: (err) => {
                this.loginLoading.set(false);
                this.loginError.set(err?.error?.message ?? 'Invalid credentials. Please try again.');
            },
        });
    }

    // ── Phone digits only, max 10 ──────────────────────
    onPhoneInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const cleaned = input.value.replace(/\D/g, '').slice(0, 10);
        input.value = cleaned;
        this.regForm.phone = cleaned;
    }

    // ── Password strength ──────────────────────────────
    onPasswordChange(): void {
        const p = this.regForm.password;
        let s = 0;
        if (p.length >= 6) s++;
        if (p.length >= 10) s++;
        if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
        if (/[0-9]/.test(p) && /[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(p)) s++;
        this.passwordStrength.set(Math.min(s, 4));
    }

    get strengthLabel(): string {
        return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength()] ?? '';
    }

    get strengthColor(): string {
        return ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][this.passwordStrength()] ?? '';
    }

    // ── Register validation (stricter) ─────────────────
    validateReg(): boolean {
        let ok = true;
        this.regErrors = {
            name: '', email: '', phone: '',
            address: '', password: '', confirmPassword: '',
        };

        const name = this.regForm.name.trim();
        const email = this.regForm.email.trim();
        const phone = this.regForm.phone.trim();
        const addr = this.regForm.address.trim();
        const pass = this.regForm.password;
        const conf = this.regForm.confirmPassword;

        // Name
        if (!name) {
            this.regErrors.name = 'Full name is required'; ok = false;
        } else if (name.length < 2) {
            this.regErrors.name = 'Name must be at least 2 characters'; ok = false;
        }

        // Email
        if (!email) {
            this.regErrors.email = 'Email is required'; ok = false;
        } else if (!this.emailRe.test(email)) {
            this.regErrors.email = 'Enter a valid email address'; ok = false;
        }

        // Phone — strict 10 digits, can't start with 0 or 1
        if (!phone) {
            this.regErrors.phone = 'Phone is required'; ok = false;
        } else if (!/^\d{10}$/.test(phone)) {
            this.regErrors.phone = 'Must be exactly 10 digits'; ok = false;
        } else if (/^[01]/.test(phone)) {
            this.regErrors.phone = 'Phone cannot start with 0 or 1'; ok = false;
        }

        // Address
        if (!addr) {
            this.regErrors.address = 'Address is required'; ok = false;
        } else if (addr.length < 6) {
            this.regErrors.address = 'Please enter a complete address'; ok = false;
        } else if (addr.length > 100) {
            this.regErrors.address = 'Address is too long (max 100)'; ok = false;
        }

        // Password — strong policy
        if (!pass) {
            this.regErrors.password = 'Password is required'; ok = false;
        } else if (pass.length < 6) {
            this.regErrors.password = 'Minimum 6 characters required'; ok = false;
        }

        // Confirm
        if (!conf) {
            this.regErrors.confirmPassword = 'Please confirm your password'; ok = false;
        } else if (pass !== conf) {
            this.regErrors.confirmPassword = 'Passwords do not match'; ok = false;
        }

        return ok;
    }

    register(): void {
        if (!this.validateReg()) return;
        this.regLoading.set(true);
        this.regApiError.set('');
        const { confirmPassword, ...payload } = this.regForm;
        this.auth.register(payload).subscribe({
            next: () => {
                this.regLoading.set(false);
                this.regSuccess.set('Account created! Redirecting to login…');
                setTimeout(() => {
                    this.switch('login');
                    this.regSuccess.set('');
                }, 2000);
            },
            error: (err) => {
                this.regLoading.set(false);
                this.regApiError.set(err?.error?.message ?? 'Registration failed. Please try again.');
            },
        });
    }

    // ── Forgot password ────────────────────────────────
    sendForgot(): void {
        this.forgotError.set('');
        const email = this.forgotEmail.trim();
        if (!email) {
            this.forgotError.set('Email is required'); return;
        }
        if (!this.emailRe.test(email)) {
            this.forgotError.set('Enter a valid email address'); return;
        }
        this.forgotLoading.set(true);
        setTimeout(() => {
            this.forgotLoading.set(false);
            this.forgotSuccess.set('Check your inbox — reset link sent!');
        }, 1500);
    }

    signInWithGoogle(): void {
        this.toast.info('Google sign-in coming soon.');
    }
}
