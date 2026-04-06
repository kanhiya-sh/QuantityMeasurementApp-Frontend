import { Injectable, signal } from '@angular/core';

export type ToastKind = 'info' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;

  readonly items = signal<ToastItem[]>([]);

  show(message: string, kind: ToastKind = 'info', durationMs = 2600): void {
    const id = ++this.seq;
    this.items.update((list) => [...list, { id, message, kind }]);
    setTimeout(() => {
      this.items.update((list) => list.filter((t) => t.id !== id));
    }, durationMs);
  }
}
