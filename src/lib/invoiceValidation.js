import { isHeicFile } from './heic.js'

export const MAX_INVOICE_BYTES = 15 * 1024 * 1024

export function validateInvoice(file) {
  if (!file || file.size === 0) throw new Error('Selecciona una imagen de la factura.')
  if (file.size > MAX_INVOICE_BYTES) throw new Error('La factura debe pesar como máximo 15 MB.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && !isHeicFile(file)) {
    throw new Error('Usa una imagen JPG, PNG, WebP o HEIC de la factura.')
  }
}
