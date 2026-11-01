
import { createElement, type CSSProperties, type ReactNode } from 'react';
import { VisualTokens } from '../theme/visual-tokens';

export class InlineErrorVisual {
  static style(): CSSProperties {
    return {
      color: VisualTokens.color.textError,
      fontSize: VisualTokens.fontSize.caption,
    };
  }

  static element(message: string | null | undefined): ReactNode {
    if (!message) return null;
    return createElement(
      'span',
      { role: 'alert', style: InlineErrorVisual.style() },
      message,
    );
  }
}
