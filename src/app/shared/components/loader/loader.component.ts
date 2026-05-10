import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-wrap">
      <div class="spinner"></div>
    </div>
  `
})
export class LoaderComponent {}
