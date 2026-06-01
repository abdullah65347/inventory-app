import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'Inventra-theme';
  
  // Theme state signal, default to checking localStorage then system preferences
  theme = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    // Setup effect to automatically apply theme attribute on signal changes
    effect(() => {
      const activeTheme = this.theme();
      this.applyTheme(activeTheme);
      localStorage.setItem(this.THEME_KEY, activeTheme);
    });
  }

  toggleTheme(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getInitialTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark';
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }

      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }
}
