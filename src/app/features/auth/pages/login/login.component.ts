import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { scaleIn } from '../../../../shared/animations/scale.animation';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [fadeIn, scaleIn]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  form = { username: '', password: '' };
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  errors = { username: '', password: '' };

  fillDemo(c: { username: string; password: string }): void {
    this.form.username = c.username;
    this.form.password = c.password;
    this.errors = { username: '', password: '' };
  }

  validate(): boolean {
    let ok = true;
    this.errors = { username: '', password: '' };
    if (!this.form.username.trim()) { this.errors.username = 'Email is required'; ok = false; }
    if (!this.form.password) { this.errors.password = 'Password is required'; ok = false; }
    return ok;
  }

  login(): void {
    if (!this.validate()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form).subscribe({
      next: () => {
        this.auth.fetchMe().subscribe({
          next: () => { this.loading.set(false); this.auth.navigateByRole(); },
          error: () => { this.loading.set(false); this.error.set('Could not fetch user details.'); }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Invalid credentials. Please try again.');
      }
    });
  }
}
