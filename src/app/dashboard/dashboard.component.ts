import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { StorageService } from '../services/storage.service';
import { ToastService } from '../services/toast.service';
import {
  QuantityService,
  QuantityApiResponse,
  quantityExtractMessage,
} from '../services/quantity.service';
import { UnitService } from '../services/unit.service';
import { STORAGE_KEYS } from '../constants/storage-keys';
import {
  ActionKind,
  ArithmeticOp,
  LastSelection,
  MeasurementType,
} from '../models/measurement.types';
import { SelectionPanelComponent }    from './selection-panel.component';
import { CalculatorPanelComponent }   from './calculator-panel.component';
import { ResultPanelComponent }       from './result-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SelectionPanelComponent, CalculatorPanelComponent, ResultPanelComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly auth          = inject(AuthService);
  private readonly router    = inject(Router);
  private readonly theme     = inject(ThemeService);
  private readonly storage   = inject(StorageService);
  private readonly toast     = inject(ToastService);
  private readonly quantity  = inject(QuantityService);
  private readonly unitsMeta = inject(UnitService);

  private readonly saved = this.storage.get<LastSelection | null>(
    STORAGE_KEYS.lastSelection, null,
  );

  readonly type      = signal<MeasurementType>(this.saved?.type      ?? 'Length');
  readonly action    = signal<ActionKind>(     this.saved?.action    ?? 'Comparison');
  readonly operation = signal<ArithmeticOp>(   this.saved?.operation ?? 'Add');
  readonly value1    = signal<number | null>(  this.saved?.value1    ?? null);
  readonly value2    = signal<number | null>(  this.saved?.value2    ?? null);
  readonly unit1     = signal<string>('');
  readonly unit2     = signal<string>('');

  readonly resultText  = signal<string>('Select options and click Calculate to see the result.');
  readonly calcLoading = signal(false);

  readonly unitsForType = computed(() => this.unitsMeta.unitsByType[this.type()]);

  readonly welcome = computed(() => {
    const name = this.auth.username();
    return name ? `Welcome, ${name}` : 'Guest Mode';
  });

  readonly isLight = this.theme.isLight;

  constructor() {
    const list = this.unitsForType();
    this.unit1.set(this.coerceUnit(this.saved?.unit1, list, list[0]));
    this.unit2.set(this.coerceUnit(this.saved?.unit2, list, list[1] ?? list[0]));

    effect(() => {
      const u = this.unitsForType();
      if (!u.includes(this.unit1())) this.unit1.set(u[0]);
      if (!u.includes(this.unit2())) this.unit2.set(u[1] ?? u[0]);
    });

    effect(() => {
      if (
        this.action() === 'Arithmetic' &&
        !(['Add', 'Subtract', 'Divide'] as ArithmeticOp[]).includes(this.operation())
      ) {
        this.operation.set('Add');
      }
    });

    effect(() => {
      const payload: LastSelection = {
        type: this.type(), action: this.action(), operation: this.operation(),
        unit1: this.unit1(), unit2: this.unit2(),
        value1: this.value1(), value2: this.value2(),
      };
      this.storage.set(STORAGE_KEYS.lastSelection, payload);
    });
  }

  toggleTheme(): void { this.theme.toggle(); }

  goHistory(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.show('Please log in to view your history.', 'error');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/history', reason: 'history' },
      });
      return;
    }
    void this.router.navigateByUrl('/history');
  }

  goLoginForHistory(): void {
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/history', reason: 'history' },
    });
  }

  setValue1(v: number | string | null): void { this.value1.set(this.parseNumber(v)); }
  setValue2(v: number | string | null): void { this.value2.set(this.parseNumber(v)); }

  onCalculate(): void {
    const action = this.action();
    const v1 = this.value1();
    const v2 = this.value2();
    const type = this.type();
    const u1   = this.unit1();
    const u2   = this.unit2();

    if (v1 === null || Number.isNaN(v1)) {
      this.toast.show('Please enter Value 1.', 'error');
      return;
    }
    if (action !== 'Conversion' && (v2 === null || Number.isNaN(v2))) {
      this.toast.show('Please enter Value 2.', 'error');
      return;
    }

    if (action === 'Conversion')  { this.runRequest(this.quantity.convert(type, v1, u1, u2)); return; }
    if (action === 'Comparison')  { this.runRequest(this.quantity.compare(type, v1, u1, v2 as number, u2)); return; }

    // FIX: Pass the actual selected operation (Add / Subtract / Divide)
    // Previously this always called add() regardless of which op button was selected.
    const op = this.operation();
    this.runRequest(this.quantity.arithmetic(type, v1, u1, v2 as number, u2, op));
  }

  private runRequest(request: Observable<QuantityApiResponse>): void {
    this.calcLoading.set(true);
    this.resultText.set('Calculating…');

    request.subscribe({
      next: (res) => {
        const text = quantityExtractMessage(res);
        this.resultText.set(text);
        this.toast.show('Result ready.');
        if (!this.auth.isLoggedIn()) {
          this.toast.show('Log in to save your calculation history.');
        }
      },
      error: (err) => {
        const msg = quantityExtractMessage((err as any)?.error ?? err);
        this.resultText.set('Error: ' + (msg || 'Something went wrong.'));
        this.toast.show(msg || 'Calculation failed.', 'error');
        this.calcLoading.set(false);
      },
      complete: () => {
        this.calcLoading.set(false);
      },
    });
  }

  private coerceUnit(unit: string | undefined, list: string[], fallback: string): string {
    return (unit && list.includes(unit)) ? unit : fallback;
  }

  private parseNumber(v: number | string | null): number | null {
    if (v === null || v === '') return null;
    const n = typeof v === 'string' ? Number(v) : v;
    return Number.isNaN(n) ? null : n;
  }
}