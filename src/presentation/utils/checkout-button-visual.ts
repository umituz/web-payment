
import { VisualTokens } from '../theme/visual-tokens';
import type { CheckoutButtonVariant } from '../components/CheckoutButton';

export interface CheckoutButtonVisualInput {
  variant: CheckoutButtonVariant;
  disabled: boolean;
  loading: boolean;
}

interface ButtonColorScheme {
  backgroundColor: string;
  color: string;
  border: string;
}

const VARIANT_COLOR_SCHEMES: Readonly<Record<CheckoutButtonVariant, ButtonColorScheme>> = Object.freeze({
  primary: Object.freeze({
    backgroundColor: VisualTokens.color.brandPrimary,
    color: VisualTokens.color.textOnPrimary,
    border: `1px solid ${VisualTokens.color.brandPrimary}`,
  }),
  secondary: Object.freeze({
    backgroundColor: VisualTokens.color.surfacePrimary,
    color: VisualTokens.color.textPrimary,
    border: `1px solid ${VisualTokens.color.borderStrong}`,
  }),
  danger: Object.freeze({
    backgroundColor: VisualTokens.color.brandDanger,
    color: VisualTokens.color.textOnPrimary,
    border: `1px solid ${VisualTokens.color.brandDanger}`,
  }),
});

export class CheckoutButtonVisual {
  static resolve({ variant, disabled, loading }: CheckoutButtonVisualInput): React.CSSProperties {
    const scheme = VARIANT_COLOR_SCHEMES[variant];
    const isInactive = disabled || loading;
    return {
      ...scheme,
      padding: `${VisualTokens.spacing.lg}px ${VisualTokens.spacing.xl}px`,
      fontSize: VisualTokens.fontSize.body,
      fontWeight: VisualTokens.fontWeight.strong,
      borderRadius: VisualTokens.radius.md,
      cursor: isInactive ? 'not-allowed' : 'pointer',
      opacity: isInactive ? VisualTokens.opacity.disabled : 1,
      transition: VisualTokens.transition.instant,
    };
  }
}
