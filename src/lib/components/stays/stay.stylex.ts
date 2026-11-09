import * as stylex from "@stylexjs/stylex";

export const stayStyles = stylex.create({
  stack: { display: "grid", gap: 14, minWidth: 0 },
  actions: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" },
  touch: { minHeight: 44 },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 640px)": "minmax(0, 1fr)",
    },
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 6,
    minWidth: 0,
    color: "var(--color-text-primary)",
    fontWeight: 600,
    fontSize: 14,
  },
  control: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    minHeight: 44,
    paddingInline: 10,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-element)",
    backgroundColor: "var(--color-background-card)",
    color: "var(--color-text-primary)",
    font: "inherit",
    fontWeight: 400,
  },
  toggle: {
    display: "flex",
    minHeight: 44,
    gap: 8,
    alignItems: "center",
    width: "fit-content",
    cursor: "pointer",
  },
  text: {
    margin: 0,
    color: "var(--color-text-secondary)",
    fontSize: 14,
    overflowWrap: "anywhere",
  },
  error: {
    margin: 0,
    color: "var(--color-text-red)",
    fontSize: 14,
    overflowWrap: "anywhere",
  },
});
