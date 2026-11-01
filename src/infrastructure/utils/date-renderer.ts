
const DEFAULT_LOCALE = 'en-US';

const ISO_DATE_DISPLAY_LENGTH = 10;
const FALLBACK_DATE_LABEL = 'soon';
const FALLBACK_LONG_DATE = '—';

export class DateRenderer {
  private readonly dateLength: number;
  private readonly shortFormatter: Intl.DateTimeFormat;
  private readonly longFormatter: Intl.DateTimeFormat;

  constructor(
    locale: string = DEFAULT_LOCALE,
    dateLength: number = ISO_DATE_DISPLAY_LENGTH,
  ) {
    this.dateLength = dateLength;
    this.shortFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    this.longFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  short(iso: string | null | undefined): string {
    if (!iso) return FALLBACK_LONG_DATE;
    return iso.slice(0, this.dateLength);
  }

  renewal(iso: string | null | undefined, fallback: string = FALLBACK_DATE_LABEL): string {
    const date = DateRenderer.parse(iso);
    if (!date) return fallback;
    return this.shortFormatter.format(date);
  }

  long(iso: string | null | undefined): string {
    if (!iso) return FALLBACK_LONG_DATE;
    const date = DateRenderer.parse(iso);
    if (!date) return iso;
    return this.longFormatter.format(date);
  }

  static parse(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
