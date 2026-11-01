
import type { CancellationReason } from '../../domain/entities/cancellation.entity';

export interface CancellationReasonOption {
  readonly value: CancellationReason;
  readonly label: string;
}

export const CANCELLATION_REASON_CATALOG: ReadonlyArray<CancellationReasonOption> = Object.freeze([
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'missing_features', label: 'Missing features' },
  { value: 'switched_service', label: 'Switched to a different service' },
  { value: 'unused', label: 'Not using it' },
  { value: 'customer_service', label: 'Poor customer service' },
  { value: 'low_quality', label: 'Quality is too low' },
  { value: 'too_complex', label: 'Too complex' },
  { value: 'other', label: 'Other' },
]);
