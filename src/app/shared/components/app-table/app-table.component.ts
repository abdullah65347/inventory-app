import {
  Component,
  ContentChild,
  Input,
  TemplateRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-table.component.html',
  styleUrls: ['./app-table.component.css']
})
export class AppTableComponent {

  @Input() loading = false;
  @Input() hasData = false;

  @ContentChild('header')
  headerTemplate!: TemplateRef<any>;

  @ContentChild('body')
  bodyTemplate!: TemplateRef<any>;

  @ContentChild('empty')
  emptyTemplate!: TemplateRef<any>;
}