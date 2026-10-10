import { inject, Injectable, signal } from '@angular/core';
import { FeedbackApiService } from './feedback-api.service';
import { Division } from '@shared/models/types';
import { DIVISIONS_CACHE_KEY } from '@shared/constants';

/**
 * Answer texts in the questionnaire name divisions in full ("Informatik"),
 * the backend by their short code. Both are matched; any other answer has no
 * division colour. Extend this when the school adds a division.
 */
const DIVISION_CODES: Record<string, string> = {
  informatik: 'HIF',
  medientechnik: 'HITM',
  elektronik: 'HEL',
  medizintechnik: 'HBG',
};

/** Only plain hex values from the dashboard's colour picker are used. */
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

/**
 * The divisions with the colours admins set in the dashboard. Used as-is: the
 * school's colours are identity and are never tinted or replaced here.
 */
@Injectable({
  providedIn: 'root',
})
export class DivisionService {
  private api = inject(FeedbackApiService);

  readonly divisions = signal<Division[]>(this.readCache());

  async load(): Promise<void> {
    try {
      const divisions = await this.api.getDivisions();
      this.divisions.set(divisions);
      localStorage.setItem(DIVISIONS_CACHE_KEY, JSON.stringify(divisions));
    } catch (err) {
      // Colours are a visual aid only; the cached ones (or none) are fine.
      console.warn('Divisions could not be loaded', err);
    }
  }

  /** Colour of the division an answer text names, or null. */
  colorFor(text: string): string | null {
    const key = text.trim().toLowerCase();
    const code = (DIVISION_CODES[key] ?? key).toLowerCase();
    const division = this.divisions().find(
      (d) => d.name.trim().toLowerCase() === code
    );
    return division && HEX_COLOR.test(division.color) ? division.color : null;
  }

  /** Colours of the school's divisions in a fixed order, for the thank-you screen. */
  schoolColors(): string[] {
    return Object.keys(DIVISION_CODES)
      .map((name) => this.colorFor(name))
      .filter((color): color is string => color !== null);
  }

  private readCache(): Division[] {
    try {
      const cached = localStorage.getItem(DIVISIONS_CACHE_KEY);
      return cached ? (JSON.parse(cached) as Division[]) : [];
    } catch {
      return [];
    }
  }
}
