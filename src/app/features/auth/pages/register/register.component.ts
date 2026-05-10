import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { scaleIn } from '../../../../shared/animations/scale.animation';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  animations: [fadeIn, scaleIn]
})
export class RegisterComponent {
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  form: RegisterForm = {
    name: '', email: '', phone: '', address: '', password: '', confirmPassword: ''
  };

  errors: RegisterErrors = {
    name: '', email: '', phone: '', address: '', password: '', confirmPassword: ''
  };

  loading  = signal(false);
  success  = signal('');
  apiError = signal('');
  showPass = signal(false);
  showConfirm = signal(false);

  passwordStrength = signal(0); // 0-4

  onPasswordChange(): void {
    const p = this.form.password;
    let score = 0;
    if (p.length >= 6)              score++;
    if (p.length >= 10)             score++;
    if (/[A-Z]/.test(p))            score++;
    if (/[0-9!@#$%^&*]/.test(p))   score++;
    this.passwordStrength.set(score);
  }

  get strengthLabel(): string {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.passwordStrength()] ?? '';
  }

  get strengthColor(): string {
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    return colors[this.passwordStrength()] ?? '';
  }

  validate(): boolean {
    let ok = true;
    this.errors = { name: '', email: '', phone: '', address: '', password: '', confirmPassword: '' };

    if (!this.form.name.trim())
      { this.errors.name = 'Full name is required'; ok = false; }

    if (!this.form.email.trim())
      { this.errors.email = 'Email is required'; ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      { this.errors.email = 'Enter a valid email address'; ok = false; }

    if (!this.form.phone.trim())
      { this.errors.phone = 'Phone number is required'; ok = false; }

    if (!this.form.address.trim())
      { this.errors.address = 'Address is required'; ok = false; }

    if (!this.form.password)
      { this.errors.password = 'Password is required'; ok = false; }
    else if (this.form.password.length < 6)
      { this.errors.password = 'Password must be at least 6 characters'; ok = false; }

    if (!this.form.confirmPassword)
      { this.errors.confirmPassword = 'Please confirm your password'; ok = false; }
    else if (this.form.password !== this.form.confirmPassword)
      { this.errors.confirmPassword = 'Passwords do not match'; ok = false; }

    return ok;
  }

  register(): void {
    if (!this.validate()) return;
    this.loading.set(true);
    this.apiError.set('');

    const { confirmPassword, ...payload } = this.form;
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Account created successfully! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.apiError.set(err?.error?.message ?? 'Registration failed. Please try again.');
      }
    });
  }
}
