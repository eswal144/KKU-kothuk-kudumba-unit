'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface BiteVacancy {
  id: number
  locationName: string
  category: string
  latitude: number
  longitude: number
  requiredMosquitoes: number
  currentMosquitoes: number
  vacancies: number
  surplus?: number
  status: 'AVAILABLE' | 'FILLED' | 'OVERSATURATED'
  statusLabel: string
  demandLevel: string
  humansDetected: number
  bloodSupplyMl: number
  message: string
  updatedAt?: string
}

interface RealGeoMapProps {
  vacancies: BiteVacancy[]
  selectedVacancyId?: number | null
  onSelectVacancy?: (loc: BiteVacancy) => void
  onApply?: (loc: BiteVacancy) => void
}

export default function RealGeoMap({
  vacancies = [],
  selectedVacancyId = null,
  onSelectVacancy,
  onApply
}: RealGeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const markersMapRef = useRef<{ [id: number]: L.Marker }>({})

  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map centered over Kochi/locality coordinates
      const map = L.map(mapContainerRef.current, {
        center: [9.9650, 76.2435],
        zoom: 15.5,
        zoomControl: true
      })

      // Ultra-clean tactical dark canvas (Zero watermark, high resolution)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ',
        maxZoom: 19
      }).addTo(map)

      // Reference Labels & Roads overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19
      }).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      layerGroupRef.current = layerGroup
      mapInstanceRef.current = map

      // Global window handler for popup button clicks
      ;(window as any).kkuHandleApplyFromPopup = (vacancyId: number) => {
        const target = vacancies.find((v) => v.id === vacancyId)
        if (target && onApply) {
          onApply(target)
        }
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      delete (window as any).kkuHandleApplyFromPopup
    }
  }, [])

  // Keep global popup click handler updated
  useEffect(() => {
    ;(window as any).kkuHandleApplyFromPopup = (vacancyId: number) => {
      const target = vacancies.find((v) => v.id === vacancyId)
      if (target && onApply) {
        onApply(target)
      }
    }
  }, [vacancies, onApply])

// Update Markers with compact iPhone Dynamic-Island-inspired status pills
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()
    markersMapRef.current = {}

    vacancies.forEach((loc) => {
      if (!loc.latitude || !loc.longitude) return

      // Calculate vacancies dynamically from backend data: requiredMosquitoes - currentMosquitoes
      const req = loc.requiredMosquitoes || 0
      const cur = loc.currentMosquitoes || 0
      const diff = req - cur

      // Dynamic Island status calculation (Requirements 3, 4, 6)
      let statusIcon = '🦟'
      let statusText = `${diff} NEEDED`
      let statusColor = '#10b981' // KKU green
      let statusBorder = 'rgba(16, 185, 129, 0.45)'
      let glowColor = 'rgba(16, 185, 129, 0.35)'

      if (loc.demandLevel === 'FILLED' || loc.status === 'FILLED' || diff <= 0) {
        statusIcon = '✓'
        statusText = 'FILLED'
        statusColor = '#38bdf8' // High-contrast sky blue for filled vacancies
        statusBorder = 'rgba(56, 189, 248, 0.7)'
        glowColor = 'rgba(56, 189, 248, 0.5)'
      } else if ((loc.demandLevel || '').toUpperCase() === 'URGENT') {
        statusIcon = '🚨'
        statusText = `${diff} NEEDED`
        statusColor = '#ef4444' // Emergency red
        statusBorder = 'rgba(239, 68, 68, 0.8)'
        glowColor = 'rgba(239, 68, 68, 0.6)'
      } else if (diff > 0) {
        statusIcon = '🦟'
        statusText = `${diff} NEEDED`
        statusColor = '#10b981' // KKU Green
        statusBorder = 'rgba(16, 185, 129, 0.5)'
        glowColor = 'rgba(16, 185, 129, 0.4)'
      } else {
        statusIcon = '⚠'
        statusText = 'OVERSTAFFED'
        statusColor = '#f59e0b'
        statusBorder = 'rgba(245, 158, 11, 0.55)'
        glowColor = 'rgba(245, 158, 11, 0.4)'
      }

      const isSelected = selectedVacancyId === loc.id

      // iPhone Dynamic-Island-Style Floating Status Pill (Requirements 1, 2, 5, 7)
      // Anchored to the EXACT geographic position [loc.latitude, loc.longitude]
      const markerHtml = `
        <div class="kku-island-anchor" style="
          position: absolute;
          bottom: 0;
          left: 0;
          transform: translate(-50%, 0);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: auto;
          user-select: none;
        ">
          <!-- Dynamic Island Capsule -->
          <div class="kku-dynamic-island ${isSelected ? 'selected' : ''}" style="
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(10, 16, 13, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid ${isSelected ? statusColor : statusBorder};
            border-radius: 9999px;
            padding: 3px 12px 4px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.65)${isSelected ? `, 0 0 16px ${statusColor}99` : ''};
            white-space: nowrap;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
            transform: ${isSelected ? 'scale(1.08)' : 'scale(1)'};
          ">
            <!-- Optional Micro Location Name Label (Requirement 5) -->
            <span style="
              font-size: 7.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: .08em;
              color: #9ca3af;
              line-height: 1.1;
              margin-bottom: 1px;
            ">
              ${loc.locationName}
            </span>

            <!-- Primary Status Content (Requirement 3) -->
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              font-weight: 800;
              color: ${statusColor};
              letter-spacing: .03em;
              line-height: 1.15;
            ">
              <span>${statusIcon}</span>
              <span>${statusText}</span>
            </div>
          </div>

          <!-- Vertical Connector Stem (Concept Diagram: │) -->
          <div style="
            width: 1.5px;
            height: 7px;
            background: ${statusColor};
            opacity: 0.9;
            margin-top: 1px;
          "></div>

          <!-- Downward Arrow Pointer (Concept Diagram: ▼) -->
          <div style="
            width: 0;
            height: 0;
            border-left: 3.5px solid transparent;
            border-right: 3.5px solid transparent;
            border-top: 5px solid ${statusColor};
          "></div>

          <!-- Exact Location Geographic Pin Dot (Concept Diagram: 📍 EXACT LOCATION) -->
          <div style="
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: ${statusColor};
            border: 1.5px solid #0a100d;
            box-shadow: 0 0 8px ${statusColor}, 0 2px 5px rgba(0,0,0,0.8);
            margin-top: 1px;
            ${isSelected ? 'transform: scale(1.3);' : ''}
          "></div>
        </div>
      `

      const markerIcon = L.divIcon({
        className: 'kku-dynamic-island-marker',
        html: markerHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0] // Exact anchor at (0, 0) where the bottom dot sits
      })

      const marker = L.marker([loc.latitude, loc.longitude], { icon: markerIcon })

      // When user clicks the location marker, select it to show full details in the right-side job panel (Requirement 8)
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        onSelectVacancy?.(loc)
      })

      markersMapRef.current[loc.id] = marker
      layerGroup.addLayer(marker)
    })
  }, [vacancies, selectedVacancyId, onSelectVacancy])

  // Center & zoom when selectedVacancyId changes (Requirement 13)
  useEffect(() => {
    if (!selectedVacancyId || !mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const vacancy = vacancies.find((v) => v.id === selectedVacancyId)

    if (vacancy) {
      map.flyTo([vacancy.latitude, vacancy.longitude], 16.5, {
        duration: 0.8,
        easeLinearity: 0.25
      })
    }
  }, [selectedVacancyId, vacancies])

  return (
    <>
      <style jsx global>{`
        .kku-dynamic-island-marker {
          background: transparent !important;
          border: none !important;
        }
        .kku-island-anchor:hover .kku-dynamic-island {
          transform: scale(1.06) translateY(-1px) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.8) !important;
        }
        @keyframes kkuPulseRing {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.4;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.8;
          }
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '540px',
          background: '#050806',
          position: 'relative',
          zIndex: 10
        }}
      />
    </>
  )
}
