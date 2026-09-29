// Compartido por el envío online y la sincronización offline.
export async function saveWorkRecord({ id, base, trabajadorId, trabajadorNombre, fotosExistentes = [], fotosNuevas = [], facturaNueva = null, facturaExistente = null }, { client, uploadPhotos, uploadInvoice, notify }) {
  const { data: existing, error: lookupError } = await client.from('registros_trabajo').select('id, fotos').eq('id', id).maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing.fotos?.length || 0
  const nuevasUrls = fotosNuevas.length > 0 ? await uploadPhotos(fotosNuevas) : []
  const invoicePath = facturaNueva ? await uploadInvoice(facturaNueva, trabajadorId) : facturaExistente
  const fotosFinales = [...fotosExistentes, ...nuevasUrls]
  const { error } = await client.from('registros_trabajo').insert({
    id, ...base, ...(invoicePath ? { factura_path: invoicePath } : {}),
    trabajador_nombre: trabajadorNombre, trabajador_id: trabajadorId, fotos: fotosFinales,
  })
  if (error) throw error
  // La notificación no debe convertir un registro guardado en un error de envío.
  Promise.resolve().then(() => notify(id)).catch(() => {})
  return fotosFinales.length
}
