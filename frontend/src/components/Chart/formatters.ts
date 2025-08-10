export const dateFmtAxis = new Intl.DateTimeFormat('fr-FR', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
});

export const dateFmtTooltip = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const numFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
