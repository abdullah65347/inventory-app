import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';
import { chatbotSlide, bubblePop, messageSlide, typingDots, fadeSwap } from '../../animations/chatbot.animation';

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chatbot.component.html',
    styleUrls: ['./chatbot.component.css'],
    animations: [chatbotSlide, bubblePop, messageSlide, typingDots, fadeSwap]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
    @ViewChild('messagesEnd') private messagesEnd!: ElementRef;
    @ViewChild('inputRef') private inputRef!: ElementRef;

    private svc = inject(ChatbotService);

    isOpen = signal(false);
    isTyping = signal(false);
    inputText = '';
    messages = signal<ChatMessage[]>([]);
    suggestions = signal<string[]>([]);
    hasNewMsg = signal(false);
    private shouldScroll = false;


    ngOnInit(): void {
        this.suggestions.set(this.svc.getSuggestedQuestions());
        // welcome message
        this.messages.set([{
            id: '0',
            from: 'bot',
            text: `Hi there! 👋 I'm your **Inventra Assistant**. I can answer questions about inventory, sales, purchases, and more. Type **help** to see all options.`,
            time: new Date()
        }]);
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    toggle(): void {
        this.isOpen.update(v => !v);
        if (this.isOpen()) {
            this.hasNewMsg.set(false);
            setTimeout(() => this.inputRef?.nativeElement.focus(), 320);
            this.shouldScroll = true;
        }
    }

    send(text?: string): void {
        const msg = (text ?? this.inputText).trim();
        if (!msg) return;

        // push user message
        const userMsg: ChatMessage = { id: Date.now().toString(), from: 'user', text: msg, time: new Date() };
        this.messages.update(m => [...m, userMsg]);
        this.inputText = '';
        this.isTyping.set(true);
        this.shouldScroll = true;

        // simulate thinking delay (300–900ms)
        const delay = 300 + Math.random() * 600;
        setTimeout(() => {
            this.svc.processMessage(msg).subscribe(response => {
                this.isTyping.set(false);
                this.messages.update(m => [...m, response]);
                this.shouldScroll = true;
                if (!this.isOpen()) this.hasNewMsg.set(true);
            });
        }, delay);
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.send();
        }
    }

    clearChat(): void {
        this.messages.set([{
            id: '0', from: 'bot', time: new Date(),
            text: 'Chat cleared! How can I help you?'
        }]);
    }

    formatText(text: string): string {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    private scrollToBottom(): void {
        try {
            const el = this.messagesEnd?.nativeElement;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch { }
    }

    cardColorClass(color?: string): string {
        const map: Record<string, string> = {
            primary: 'card-primary',
            success: 'card-success',
            warning: 'card-warning',
            danger: 'card-danger',
            accent: 'card-accent',
            muted: 'card-muted',
        };
        return map[color ?? ''] ?? 'card-primary';
    }
}