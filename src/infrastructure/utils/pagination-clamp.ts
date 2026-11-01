
import { API_MAX_PAGE_SIZE } from '../constants/billing.constants';

export const MIN_PAGE_SIZE = 1;

export class PaginationClamp {
  static pageSize(raw: number | undefined, max: number = API_MAX_PAGE_SIZE): number {
    if (raw === undefined) return max;
    return Math.min(Math.max(MIN_PAGE_SIZE, raw), max);
  }
}
