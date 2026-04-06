import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  QuantityService,
  HistoryItem,
  quantityExtractMessage,
} from '../services/quantity.service';
import { ToastService } from '../services/toast.service';
import { ThemeService } from '../services/theme.service';

/**
 * FIX: Added loading state reset in error handler (was missing `complete`).
 * The loading spinner would stay forever if history fetch failed.
 *
 * Also handles the edge case where the backend returns an empty array
 * vs a non-array gracefully.
 */
@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  private readonly quantity = inject(QuantityService);
  private readonly toast    = inject(ToastService);
  private readonly router   = inject(Router);
  private readonly theme    = inject(ThemeService);

  readonly isLight   = this.theme.isLight;
  readonly loading   = signal(true);
  readonly items     = signal<HistoryItem[]>([]);
  readonly loadError = signal('');

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.quantity.getHistory().subscribe({
      next: (res) => {
        this.items.set(Array.isArray(res) ? res : []);
      },
      error: (err) => {
        const msg = quantityExtractMessage((err as any)?.error ?? err);
        this.loadError.set(msg || 'Unable to load history.');
        this.toast.show(this.loadError(), 'error');
        this.loading.set(false); // FIX: spinner must stop on error
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  badgeClass(operation: string | undefined): string {
    const op = (operation ?? '').toUpperCase();
    if (op.includes('ADD'))     return 'op-add';
    if (op.includes('CONVERT')) return 'op-convert';
    return 'op-compare';
  }

  formattedTimestamp(raw?: string): string {
    if (!raw) return 'No timestamp';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString();
  }
}
