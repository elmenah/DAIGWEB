import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Centro por defecto cuando el activo aún no tiene coordenadas (La Serena, zona ADVA).
const DEFAULT_CENTER = [-29.9045, -71.2489]

const pinIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#E8962E;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  className: '',
})

// Reverse geocoding (coordenadas → dirección) vía OpenStreetMap.
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`)
    const d = await res.json()
    return d?.display_name || ''
  } catch { return '' }
}

function ClickHandler({ onPick }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng
      const dir = await reverseGeocode(lat, lng)
      onPick(+lat.toFixed(7), +lng.toFixed(7), dir)
    },
  })
  return null
}

// Recentra el mapa cuando cambian las coordenadas desde afuera (búsqueda de dirección)
// y corrige el tamaño al abrirse dentro del modal.
function Recenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15))
    }
    const t = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(t)
  }, [lat, lng, map])
  return null
}

export default function LocationPicker({ lat, lng, onPick }) {
  const hasPin = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
  const center = hasPin ? [lat, lng] : DEFAULT_CENTER

  const onDrag = async (e) => {
    const m = e.target.getLatLng()
    const dir = await reverseGeocode(m.lat, m.lng)
    onPick(+m.lat.toFixed(7), +m.lng.toFixed(7), dir)
  }

  return (
    <div style={{ height: 240, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
      <MapContainer center={center} zoom={hasPin ? 15 : 12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        <Recenter lat={hasPin ? lat : null} lng={hasPin ? lng : null} />
        {hasPin && (
          <Marker position={[lat, lng]} draggable icon={pinIcon} eventHandlers={{ dragend: onDrag }} />
        )}
      </MapContainer>
    </div>
  )
}
