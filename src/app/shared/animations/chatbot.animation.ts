import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const chatbotSlide = trigger('chatbotSlide', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(0.92)' }),
        animate('320ms cubic-bezier(0.34,1.56,0.64,1)',
            style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
    ]),
    transition(':leave', [
        animate('200ms cubic-bezier(0.4,0,0.2,1)',
            style({ opacity: 0, transform: 'translateY(16px) scale(0.94)' }))
    ])
]);

export const bubblePop = trigger('bubblePop', [
    transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.7) translateY(10px)' }),
        animate('280ms cubic-bezier(0.34,1.56,0.64,1)',
            style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
    ])
]);

export const messageSlide = trigger('messageSlide', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms cubic-bezier(0.4,0,0.2,1)',
            style({ opacity: 1, transform: 'translateY(0)' }))
    ])
]);

export const typingDots = trigger('typingDots', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('160ms ease', style({ opacity: 1 }))
    ]),
    transition(':leave', [
        animate('120ms ease', style({ opacity: 0 }))
    ])
]);

export const fadeSwap = trigger('fadeSwap', [
    transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.7)' }),
        animate('250ms cubic-bezier(0.34,1.56,0.64,1)',
            style({ opacity: 1, transform: 'scale(1)' }))
    ]),
    transition(':leave', [
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('150ms ease-in',
            style({ opacity: 0, transform: 'scale(0.7)' }))
    ])
]);