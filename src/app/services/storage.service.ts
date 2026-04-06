import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly doc = inject(DOCUMENT);

  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.doc.defaultView?.localStorage?.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set(key: string, value: unknown): void {
    this.doc.defaultView?.localStorage?.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.doc.defaultView?.localStorage?.removeItem(key);
  }
}
