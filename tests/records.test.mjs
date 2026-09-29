import { test } from 'node:test'
import assert from 'node:assert/strict'
import { saveWorkRecord } from '../src/lib/saveWorkRecord.js'

function fixture({ existing = null, photoError = null, invoiceError = null, insertError = null } = {}) {
  const inserted = []
  const uploads = []
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: existing }), insert: async value => { inserted.push(value); return { error: insertError } } }
  const deps = {
    client: { from: () => query },
    uploadPhotos: async files => { if (photoError) throw photoError; uploads.push(...files); return ['foto.jpg'] },
    uploadInvoice: async (file, owner) => { if (invoiceError) throw invoiceError; uploads.push(file); return `${owner}/factura.jpg` },
    notify: async () => {},
  }
  return { deps, inserted, uploads }
}
const payload = { id: 'stable-id', base: { tarea: 'Mantención' }, trabajadorId: 'worker', trabajadorNombre: 'Nombre', fotosNuevas: ['foto-blob'], facturaNueva: 'factura-blob' }

test('guarda la ruta privada de factura con el registro y fotos', async () => {
  const { deps, inserted } = fixture()
  assert.equal(await saveWorkRecord(payload, deps), 1)
  assert.equal(inserted[0].factura_path, 'worker/factura.jpg')
  assert.equal(inserted[0].id, payload.id)
  assert.equal(inserted[0].trabajador_id, 'worker')
})
test('fallo de foto o factura impide guardar un registro incompleto', async () => {
  for (const failure of [{ photoError: new Error('storage') }, { invoiceError: new Error('invoice') }]) {
    const { deps, inserted } = fixture(failure)
    await assert.rejects(saveWorkRecord(payload, deps))
    assert.equal(inserted.length, 0)
  }
})
test('reintento tras respuesta perdida no duplica registro ni archivos', async () => {
  const { deps, inserted, uploads } = fixture({ existing: { id: payload.id, fotos: ['foto.jpg'] } })
  assert.equal(await saveWorkRecord(payload, deps), 1)
  assert.equal(inserted.length, 0)
  assert.equal(uploads.length, 0)
})
test('error al insertar se propaga para conservar el elemento pendiente', async () => {
  const { deps } = fixture({ insertError: new Error('Database unavailable') })
  await assert.rejects(saveWorkRecord(payload, deps), /Database unavailable/)
})
test('un registro sin factura no obliga a adjuntar archivo', async () => {
  const { deps, inserted } = fixture()
  await saveWorkRecord({ ...payload, facturaNueva: null }, deps)
  assert.equal('factura_path' in inserted[0], false)
})
