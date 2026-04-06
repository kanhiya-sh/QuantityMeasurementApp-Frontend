import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArithmeticOp, MeasurementType } from '../models/measurement.types';
import { environment } from '../../environments/environment';

type QuantityType = MeasurementType;

export interface QuantityDto {
  value: number;
  unit: string;
  type: QuantityType;
}

export interface QuantityApiResponse {
  result?: string;
  message?: string;
  data?: unknown;
  value?: number;
  unit?: string;
  type?: string;
  equal?: boolean;
  [key: string]: unknown;
}

export interface HistoryItem {
  id?: number;
  operation: string;
  result: string;
  username?: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class QuantityService {
  private readonly http    = inject(HttpClient);
  // Reads from environment.ts (local) or environment.prod.ts (production)
  private readonly baseUrl = environment.apiUrl;

  compare(
    type: QuantityType,
    value1: number, unit1: string,
    value2: number, unit2: string,
  ): Observable<QuantityApiResponse> {
    const body: QuantityDto[] = [
      { value: value1, unit: unit1, type },
      { value: value2, unit: unit2, type },
    ];
    return this.http.post<QuantityApiResponse>(
      `${this.baseUrl}/api/v1/quantities/compare`, body,
    );
  }

  convert(
    type: QuantityType,
    value: number, unit: string, target: string,
  ): Observable<QuantityApiResponse> {
    const body: QuantityDto = { value, unit, type };
    const params = new HttpParams().set('target', target);
    return this.http.post<QuantityApiResponse>(
      `${this.baseUrl}/api/v1/quantities/convert`, body, { params },
    );
  }

  arithmetic(
    type: QuantityType,
    value1: number, unit1: string,
    value2: number, unit2: string,
    operation: ArithmeticOp,
  ): Observable<QuantityApiResponse> {
    const body: QuantityDto[] = [
      { value: value1, unit: unit1, type },
      { value: value2, unit: unit2, type },
    ];
    const params = new HttpParams().set('operation', operation);
    return this.http.post<QuantityApiResponse>(
      `${this.baseUrl}/api/v1/quantities/add`, body, { params },
    );
  }

  getHistory(): Observable<HistoryItem[]> {
    return this.http.get<HistoryItem[]>(
      `${this.baseUrl}/api/v1/quantities/history`,
    );
  }
}

export function quantityExtractMessage(res: unknown): string {
  if (res == null) return 'No response from server.';

  if (typeof res === 'object' && (res as any)['isTrusted'] === true) {
    return 'Network request failed. Is the API server running?';
  }

  if (typeof res === 'string') {
    const s = res.trim();
    if (s.length > 0) return s;
  }

  const r = res as Record<string, unknown>;

  if (typeof r['result'] === 'string' && r['result'].trim()) return r['result'] as string;
  if (typeof r['value'] === 'number' && typeof r['unit'] === 'string') return `${r['value']} ${r['unit']}`;
  if (typeof r['message'] === 'string' && r['message'].trim()) return r['message'] as string;
  if (typeof r['error'] === 'string' && r['error'].trim()) return r['error'] as string;
  if (typeof r['statusText'] === 'string' && r['statusText'].trim() && r['statusText'] !== 'Unknown Error') {
    return r['statusText'] as string;
  }

  return JSON.stringify(r['data'] ?? res);
}
