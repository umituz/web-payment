
import type { CSSProperties } from 'react';
import { VisualTokens } from '../theme/visual-tokens';

export const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const card: CSSProperties = {
  background: VisualTokens.color.surfacePrimary,
  border: `1px solid ${VisualTokens.color.borderSubtle}`,
  borderRadius: VisualTokens.radius.lg,
  padding: VisualTokens.spacing.section,
  boxSizing: 'border-box',
};

export const cardInteractive: CSSProperties = {
  ...card,
  cursor: 'pointer',
};

export const sectionTitle: CSSProperties = {
  fontSize: VisualTokens.fontSize.title,
  fontWeight: VisualTokens.fontWeight.strong,
  color: VisualTokens.color.textPrimary,
  margin: 0,
  marginBottom: VisualTokens.spacing.xl,
};

export const mutedText: CSSProperties = {
  color: VisualTokens.color.textMuted,
  fontSize: VisualTokens.fontSize.body,
};

export const stack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: VisualTokens.spacing.xl,
};

export const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

export const autoGrid = (minColumnWidth = 260): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
  gap: VisualTokens.spacing.section,
});

export const alertDanger: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: VisualTokens.spacing.md,
  padding: VisualTokens.spacing.lg,
  borderRadius: VisualTokens.radius.md,
  border: `1px solid ${VisualTokens.color.borderWarning}`,
  background: VisualTokens.color.surfaceDangerMuted,
  color: VisualTokens.color.brandDangerText,
  fontSize: VisualTokens.fontSize.body,
};
