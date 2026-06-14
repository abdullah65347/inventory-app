import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatStripItem {
  icon: string;
  value: number | string;
  label: string;
  iconClass: string; // e.g. 'icon-users'
  format?: 'number' | 'currency' | 'plain';
  trend?: number;       // e.g. +12.5 or -4.2 (optional)
  trendLabel?: string;  // e.g. 'vs last month' (optional)
}

@Component({
  selector: 'app-stat-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-strip mb-24">
      @for (item of items; track item.label; let last = $last) {
        <div class="stat-strip-item">
          <div class="stat-strip-icon {{ item.iconClass }}">
            <i [class]="'bi ' + item.icon"></i>
          </div>
          <div class="stat-strip-text">
            <div class="stat-strip-value">
              @if (item.format === 'currency') {
                ₹{{ item.value | number:'1.0-0' }}
              } @else if (item.format === 'number') {
                {{ item.value | number:'1.0-0' }}
              } @else {
                {{ item.value }}
              }
            </div>
            <div class="stat-strip-label">{{ item.label }}</div>
            @if (item.trend !== undefined) {
              <div class="stat-strip-trend" [class.trend-up]="item.trend >= 0" [class.trend-down]="item.trend < 0">
                <i class="bi {{ item.trend >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right' }}"></i>
                <span>{{ item.trend >= 0 ? '+' : '' }}{{ item.trend }}%</span>
                @if (item.trendLabel) {
                  <span class="trend-context">{{ item.trendLabel }}</span>
                }
              </div>
            }
          </div>
        </div>
        @if (!last) {
          <div class="stat-strip-divider"></div>
        }
      }
    </div>
  `,
  styleUrls: ['./stat-strip.component.css']
})
export class StatStripComponent {
  @Input() items: StatStripItem[] = [];
}