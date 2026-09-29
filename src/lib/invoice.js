import { supabase } from './supabase'
import { isHeicFile, isHeicByHeader, heicBlobToJpeg } from './heic'

export const INVOICE_BUCKET = 'registros-facturas'
import { validateInvoice, MAX_INVOICE_BYTES } from './invoiceValidation.js'
export { validateInvoice } from './invoiceValidation.js'

export async function uploadInvoice(file, userId) {
  validateInvoice(file)
  const heic = isHeicFile(file) || await isHeicByHeader(file)
  const blob = heic ? await heicBlobToJpeg(file) : file
  if (blob.size > MAX_INVOICE_BYTES) throw new Error('La imagen convertida supera 15 MB. Elige una foto más pequeña.')
  const contentType = heic ? 'image/jpeg' : file.type
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[contentType]
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(INVOICE_BUCKET).upload(path, blob, { contentType, upsert: false })
  if (error) throw error
  return path
}
