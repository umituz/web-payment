
import { useState } from 'react';
import { useBilling } from '../context/billing-context';
import { InlineErrorVisual } from '../utils/inline-error-visual';
import { VisualTokens } from '../theme/visual-tokens';

export interface CustomerPortalLinkProps {
  label?: string;
  target?: 'redirect' | 'open';
  className?: string;
  labels?: CustomerPortalLinkLabels;
}

export interface CustomerPortalLinkLabels {
  loading?: string;
}

const DEFAULT_LABEL = 'Manage subscription';
const DEFAULT_LOADING_LABEL = 'Opening…';

export function CustomerPortalLink({
  label = DEFAULT_LABEL,
  target = 'open',
  className,
  labels,
}: CustomerPortalLinkProps) {
  const { getPortalUrl } = useBilling();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadingLabel = labels?.loading ?? DEFAULT_LOADING_LABEL;

  const open = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await getPortalUrl();
      if (target === 'open') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: VisualTokens.spacing.xs }}>
      <button
        type="button"
        onClick={() => void open()}
        disabled={loading}
        className={className}
        style={{
          background: 'transparent',
          color: VisualTokens.color.brandPrimary,
          border: 'none',
          padding: 0,
          textDecoration: 'underline',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? loadingLabel : label}
      </button>
      {InlineErrorVisual.element(error)}
    </span>
  );
}
