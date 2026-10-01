import { collectInvoicePaths } from './invoicePaths.js'

// Conserva compatibilidad con registros de la cola offline anterior.
export async function saveWorkRecord({ id, base, trabajadorId, trabajadorNombre, fotosExistentes = [], fotosNuevas = [], facturaNueva = null, facturaExistente = null, facturasNuevas = facturaNueva ? [facturaNueva] : [], facturasExistentes = facturaExistente ? [facturaExistente] : [] }, { client, uploadPhotos, uploadInvoice, notify }) {
  const { data: existing, error: lookupError } = await client.from('registros_trabajo').select('id, fotos').eq('id', id).maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing.fotos?.length || 0
  const nuevasUrls = fotosNuevas.length > 0 ? await uploadPhotos(fotosNuevas) : []
  const invoicePaths = await collectInvoicePaths(facturasExistentes, facturasNuevas, trabajadorId, uploadInvoice)
  const fotosFinales = [...fotosExistentes, ...nuevasUrls]
  const { error } = await client.from('registros_trabajo').insert({
    id, ...base, ...(invoicePaths.length ? { factura_paths: invoicePaths, factura_path: invoicePaths[0] } : {}),
    trabajador_nombre: trabajadorNombre, trabajador_id: trabajadorId, fotos: fotosFinales,
  })
  if (error) throw error
  // La notificación no debe convertir un registro guardado en un error de envío.
  Promise.resolve().then(() => notify(id)).catch(() => {})
  return fotosFinales.length
}
