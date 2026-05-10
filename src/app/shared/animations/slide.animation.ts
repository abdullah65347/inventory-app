import { trigger, transition, style, animate } from '@angular/animations';

export const slideInLeft = trigger('slideInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate('300ms ease', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate('300ms ease', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);
