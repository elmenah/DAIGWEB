import { test } from 'node:test'
import assert from 'node:assert/strict'
import { saveWorkRecord } from '../src/lib/saveWorkRecord.js'
import { getInvoicePaths, collectInvoicePaths } from '../src/lib/invoicePaths.js'

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

test('guarda varias facturas nuevas y conserva las existentes', async () => {
  const { deps, inserted } = fixture()
  deps.uploadInvoice = async file => `worker/${file}.jpg`
  await saveWorkRecord({ ...payload, facturasNuevas: ['uno', 'dos'], facturasExistentes: ['worker/anterior.jpg'] }, deps)
  assert.deepEqual(inserted[0].factura_paths, ['worker/anterior.jpg', 'worker/uno.jpg', 'worker/dos.jpg'])
  assert.equal(inserted[0].factura_path, 'worker/anterior.jpg')
})

test('la cola antigua con una factura se guarda en el nuevo formato', async () => {
  const { deps, inserted } = fixture()
  await saveWorkRecord(payload, deps)
  assert.deepEqual(inserted[0].factura_paths, ['worker/factura.jpg'])
})

test('si falla la segunda factura no se inserta un registro parcial', async () => {
  const { deps, inserted } = fixture()
  deps.uploadInvoice = async file => {
    if (file === 'dos') throw new Error('Network offline')
    return 'worker/uno.jpg'
  }
  await assert.rejects(saveWorkRecord({ ...payload, facturasNuevas: ['uno', 'dos'] }, deps), /Network offline/)
  assert.equal(inserted.length, 0)
})

test('lectura compatible con factura anterior y eliminación de todas', () => {
  assert.deepEqual(getInvoicePaths({ factura_path: 'anterior.jpg' }), ['anterior.jpg'])
  assert.deepEqual(getInvoicePaths({ factura_paths: [], factura_path: 'anterior.jpg' }), [])
  assert.deepEqual(getInvoicePaths({ factura_paths: ['una.jpg', 'dos.jpg'] }), ['una.jpg', 'dos.jpg'])
})

test('editar permite quitar una factura, agregar otra o quitar todas', async () => {
  const upload = async file => `${file}.jpg`
  assert.deepEqual(await collectInvoicePaths(['conservada.jpg'], ['nueva'], 'worker', upload), ['conservada.jpg', 'nueva.jpg'])
  assert.deepEqual(await collectInvoicePaths([], [], 'worker', upload), [])
})
