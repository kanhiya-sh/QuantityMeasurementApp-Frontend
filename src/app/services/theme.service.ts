import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/storage-keys';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly doc = inject(DOCUMENT);

  readonly theme = signal<ThemeMode>(
    this.storage.get<ThemeMode | null>(STORAGE_KEYS.theme, null) ?? 'dark',
  );

  readonly isLight = computed(() => this.theme() === 'light');

  constructor() {
    effect(() => {
      const mode = this.theme();
      this.doc.body.classList.toggle('light', mode === 'light');
      this.storage.set(STORAGE_KEYS.theme, mode);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
