import * as stylex from '@stylexjs/stylex';

export const portal = stylex.create({
  stack: { display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 },
  compact: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflowWrap: 'anywhere' },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  spread: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grid: {
    display: 'grid', gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))'
  },
  metrics: {
    display: 'grid', gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 144px), 1fr))'
  },
  metric: { fontSize: 22, fontWeight: 650, overflowWrap: 'anywhere' },
  control: { minHeight: 44, maxWidth: '100%' },
  fields: {
    display: 'grid', gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))'
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, fontSize: 14, fontWeight: 550 },
  input: {
    width: '100%', minWidth: 0, minHeight: 44, paddingInline: 10, font: 'inherit',
    color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-card)',
    boxSizing: 'border-box', borderWidth: 1, borderStyle: 'solid',
    borderColor: 'var(--color-border-emphasized)', borderRadius: 'var(--radius-element)'
  },
  fieldset: {
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)', minWidth: 0, padding: 12
  },
  check: { display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, overflowWrap: 'anywhere', cursor: 'pointer' },
  empty: { padding: 18, backgroundColor: 'var(--color-background-muted)', borderRadius: 'var(--radius-container)' }
});
