// Un array vacío significa que se quitaron todas las facturas. Solo los
// registros anteriores a la migración usan el campo individual como respaldo.
export function getInvoicePaths(record) {
  if (Array.isArray(record.factura_paths)) return record.factura_paths
  return record.factura_path ? [record.factura_path] : []
}

export async function collectInvoicePaths(existing, files, owner, upload) {
  const paths = [...existing]
  for (const file of files) paths.push(await upload(file, owner))
  return paths
}
