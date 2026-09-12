'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface DemandLocation {
  id: number
  name: string
  category: string
  currentMosquitoes: number
  humansDetected: number
  animalsDetected: number
  requiredMosquitoes: number
  vacancies: number
  surplus: number
  status: 'VACANCIES_AVAILABLE' | 'OVERSTAFFED'
  demandLevel: string
  estimatedBloodmL: string
  lat: number
  lng: number
}

interface RealGeoMapProps {
  demandLocations?: DemandLocation[]
  onSelectDemandLocation?: (loc: DemandLocation) => void
}

export default function RealGeoMap({
  demandLocations = [],
  onSelectDemandLocation
}: RealGeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered over locality neighborhood
      const map = L.map(mapContainerRef.current, {
        center: [9.9650, 76.2425], // Locality center
        zoom: 15.5,
        zoomControl: true
      })

      // CartoDB Dark Matter Tiles (Fits KKU dark-mode aesthetic)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update Markers & Overlay Layers when props change
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()

    // MOSQUITO BITE VACANCY & DEMAND MAP MARKERS
    demandLocations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return

      const isVacant = loc.status === 'VACANCIES_AVAILABLE'
      const isCritical = loc.demandLevel === 'CRITICAL' || loc.demandLevel === 'HIGH'

      const statusBadge = isVacant
        ? `<span style="background: rgba(16,185,129,0.25); color: #10b981; border: 1px solid #10b981; padding: 2px 6px; border-radius: 2px; font-weight: 800;">🟢 ${loc.vacancies} VACANCIES AVAILABLE</span>`
        : `<span style="background: rgba(239,68,68,0.25); color: #ef4444; border: 1px solid #ef4444; padding: 2px 6px; border-radius: 2px; font-weight: 800;">🔴 OVERSTAFFED (${loc.surplus} surplus)</span>`

      const pinBorderColor = isVacant ? (isCritical ? '#f59e0b' : '#10b981') : '#ef4444'

      // Vacancy Market Radius Ring
      const circle = L.circle([loc.lat, loc.lng], {
        radius: 250,
        color: pinBorderColor,
        fillColor: pinBorderColor,
        fillOpacity: 0.15,
        weight: 1.5
      })
      circle.on('click', () => onSelectDemandLocation?.(loc))
      layerGroup.addLayer(circle)

      // Custom Vacancy Marker Pin
      const demandIcon = L.divIcon({
        className: 'kku-demand-node-pin',
        html: `<div style="
          background: rgba(14, 20, 18, 0.95);
          border: 1.5px solid ${pinBorderColor};
          padding: 6px 10px;
          border-radius: 4px;
          color: #f1f5f9;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.8);
          cursor: pointer;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 12px; font-weight: 800; color: #f8fafc;">📍 ${loc.name}</span>
            <span style="font-size: 9px; text-transform: uppercase; color: #94a3b8;">${loc.category}</span>
          </div>
          <div style="font-size: 10px; margin-bottom: 4px;">
            ${statusBadge}
          </div>
          <div style="display: flex; gap: 8px; font-size: 9px; color: #cbd5e1; font-family: monospace;">
            <span>🦟 ${loc.currentMosquitoes}</span>
            <span>👤 ${loc.humansDetected}</span>
            <span>🐕 ${loc.animalsDetected}</span>
            <span style="color: #10b981;">🩸 ${loc.estimatedBloodmL}</span>
          </div>
        </div>`,
        iconSize: [210, 64],
        iconAnchor: [105, 32]
      })

      const marker = L.marker([loc.lat, loc.lng], { icon: demandIcon })
      marker.on('click', () => onSelectDemandLocation?.(loc))
      layerGroup.addLayer(marker)
    })

  }, [demandLocations, onSelectDemandLocation])

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '480px',
        background: '#0a0f0d',
        position: 'relative',
        zIndex: 10
      }}
    />
  )
}


