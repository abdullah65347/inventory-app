import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const fadeInList = trigger('fadeInList', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      stagger(50, animate('250ms ease', style({ opacity: 1, transform: 'translateY(0)' })))
    ], { optional: true })
  ])
]);
