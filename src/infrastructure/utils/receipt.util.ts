export function formatReceiptNumber(id: string, prefix = 'RCP'): string {
  if (!id || typeof id !== 'string') return `${prefix}-00000000`;
  const clean = id.replace(/[^a-zA-Z0-9]/g, '');
  const tail = clean.length >= 8 ? clean.slice(-8) : clean.padStart(8, '0');
  return `${prefix}-${tail.toUpperCase()}`;
}
