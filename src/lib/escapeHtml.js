// Escapa texto para interpolarlo de forma segura dentro de HTML.
// Se usa en los generadores de impresión/PDF del panel, donde se inyectan
// campos ingresados por los trabajadores (evita XSS almacenado).
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
