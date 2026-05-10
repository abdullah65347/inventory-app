import { trigger, transition, style, animate } from '@angular/animations';

export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.92)' }),
    animate('250ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);
