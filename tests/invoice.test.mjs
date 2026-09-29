import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateInvoice, MAX_INVOICE_BYTES } from '../src/lib/invoiceValidation.js'

test('factura admite imágenes y HEIC de iPhone sin MIME', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/heic']) {
    assert.doesNotThrow(() => validateInvoice({ type, name: 'factura', size: 100 }))
  }
  assert.doesNotThrow(() => validateInvoice({ type: '', name: 'FACTURA.HEIC', size: 100 }))
})
test('factura rechaza archivos vacíos, documentos y tamaño excesivo', () => {
  assert.throws(() => validateInvoice(null), /Selecciona/)
  assert.throws(() => validateInvoice({ type: 'image/jpeg', size: 0 }), /Selecciona/)
  assert.throws(() => validateInvoice({ type: 'application/pdf', name: 'factura.pdf', size: 100 }), /imagen/)
  assert.throws(() => validateInvoice({ type: 'image/jpeg', size: MAX_INVOICE_BYTES + 1 }), /15 MB/)
  assert.doesNotThrow(() => validateInvoice({ type: 'image/jpeg', size: MAX_INVOICE_BYTES }))
})
