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

      // CartoDB Dark Matter Tiles (Clean KKU tactical aesthetic)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
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

  // Update Markers & Popups when vacancies change (NO LARGE CIRCLES)
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()
    markersMapRef.current = {}

    vacancies.forEach((loc) => {
      if (!loc.latitude || !loc.longitude) return

      const isAvailable = loc.vacancies > 0
      const isOversaturated = loc.status === 'OVERSATURATED'
      const isUrgent = loc.demandLevel === 'URGENT' || loc.demandLevel === 'HIGH'

      // Color coding (Requirement 8)
      // GREEN: vacancy available / healthy staffing
      // AMBER: high demand / urgent recruitment
      // RED: oversaturated or critical state
      let pinColor = '#10b981' // KKU mint green
      if (isOversaturated) {
        pinColor = '#ef4444' // Red
      } else if (isUrgent) {
        pinColor = '#f59e0b' // Amber
      }

      // Compact KKU Map Marker Pin (NO LARGE COVERAGE CIRCLES)
      const markerIcon = L.divIcon({
        className: 'kku-clean-marker',
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #0a100d;
              border: 2px solid ${pinColor};
              box-shadow: 0 0 12px ${pinColor}88, 0 4px 10px rgba(0,0,0,0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              transition: transform 0.2s ease;
            ">
              🦟
            </div>
            <div style="
              margin-top: 4px;
              background: rgba(10, 16, 13, 0.92);
              border: 1px solid ${pinColor}66;
              padding: 2px 7px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              color: #f1f5f2;
              white-space: nowrap;
              letter-spacing: .04em;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            ">
              ${loc.locationName}
            </div>
          </div>
        `,
        iconSize: [30, 48],
        iconAnchor: [15, 24]
      })

      const marker = L.marker([loc.latitude, loc.longitude], { icon: markerIcon })

      // Compact Location Popup Content (Requirements 2, 3, 4, 5, 9)
      const statusBadge = isAvailable
        ? `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid #10b981; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 9px;">🟢 ${loc.vacancies} VACANCIES AVAILABLE</span>`
        : loc.status === 'FILLED'
        ? `<span style="background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid #60a5fa; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 9px;">✓ FULLY STAFFED</span>`
        : `<span style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid #ef4444; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 9px;">⚠ OVERSATURATED</span>`

      const popupHtml = `
        <div style="
          font-family: inherit;
          color: #f1f5f2;
          min-width: 240px;
          max-width: 280px;
          padding: 2px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; border-bottom: 1px solid #1c2a23; padding-bottom: 6px;">
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #ffffff; letter-spacing: .02em;">
                📍 ${loc.locationName}
              </div>
              <div style="font-size: 9px; text-transform: uppercase; color: #8b9891; font-weight: 600; margin-top: 1px;">
                ${loc.category}
              </div>
            </div>
            <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: ${pinColor}; border: 1px solid ${pinColor}; padding: 1px 5px; border-radius: 3px;">
              ${loc.demandLevel}
            </span>
          </div>

          <div style="margin-bottom: 8px;">
            ${statusBadge}
          </div>

          <p style="margin: 0 0 10px; font-size: 11px; line-height: 1.4; color: #d1d5db; font-style: italic;">
            "${loc.message}"
          </p>

          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            background: #050806;
            border: 1px solid #1c2a23;
            border-radius: 6px;
            padding: 8px;
            font-size: 10px;
            margin-bottom: 10px;
          ">
            <div>
              <span style="color: #8b9891; font-size: 8px; text-transform: uppercase; display: block;">NEED</span>
              <strong style="color: #ffffff;">${loc.requiredMosquitoes} mosquitoes</strong>
            </div>
            <div>
              <span style="color: #8b9891; font-size: 8px; text-transform: uppercase; display: block;">CURRENT</span>
              <strong style="color: ${isAvailable ? '#10b981' : '#f87171'};">${loc.currentMosquitoes} mosquitoes</strong>
            </div>
            <div>
              <span style="color: #8b9891; font-size: 8px; text-transform: uppercase; display: block;">HUMAN HOSTS</span>
              <strong style="color: #60a5fa;">👤 ${loc.humansDetected} hosts</strong>
            </div>
            <div>
              <span style="color: #8b9891; font-size: 8px; text-transform: uppercase; display: block;">BLOOD SUPPLY</span>
              <strong style="color: #f59e0b;">🩸 ${loc.bloodSupplyMl} mL</strong>
            </div>
          </div>

          ${
            isAvailable
              ? `<button
                  onclick="window.kkuHandleApplyFromPopup(${loc.id})"
                  style="
                    width: 100%;
                    background: #10b981;
                    color: #050806;
                    border: none;
                    padding: 7px 12px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    text-transform: uppercase;
                    letter-spacing: .06em;
                  "
                >
                  ✈️ Fly Here & Apply for Vacancy
                </button>`
              : `<div style="
                  text-align: center;
                  font-size: 10px;
                  color: #8b9891;
                  padding: 4px;
                  background: #050806;
                  border: 1px solid #1c2a23;
                  border-radius: 4px;
                  font-weight: 600;
                ">
                  ${isOversaturated ? '⚠ Sector Oversaturated' : '✓ All Positions Occupied'}
                </div>`
          }
        </div>
      `

      marker.bindPopup(popupHtml, {
        className: 'kku-dark-popup',
        closeButton: true,
        maxWidth: 290
      })

      marker.on('click', () => {
        onSelectVacancy?.(loc)
      })

      markersMapRef.current[loc.id] = marker
      layerGroup.addLayer(marker)
    })
  }, [vacancies, onSelectVacancy])

  // Center, zoom, and open popup when selectedVacancyId changes (Requirement 13)
  useEffect(() => {
    if (!selectedVacancyId || !mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const marker = markersMapRef.current[selectedVacancyId]
    const vacancy = vacancies.find((v) => v.id === selectedVacancyId)

    if (marker && vacancy) {
      map.flyTo([vacancy.latitude, vacancy.longitude], 16.5, {
        duration: 0.8,
        easeLinearity: 0.25
      })
      setTimeout(() => {
        marker.openPopup()
      }, 400)
    }
  }, [selectedVacancyId, vacancies])

  return (
    <>
      <style jsx global>{`
        @keyframes kkuPopupEnter {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .kku-dark-popup .leaflet-popup-content-wrapper {
          background: #0a100d !important;
          border: 1px solid #1c2a23 !important;
          border-radius: 8px !important;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75) !important;
          padding: 8px !important;
          animation: kkuPopupEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .kku-dark-popup .leaflet-popup-tip {
          background: #0a100d !important;
          border: 1px solid #1c2a23 !important;
        }
        .kku-dark-popup .leaflet-popup-content {
          margin: 6px !important;
          line-height: 1.4 !important;
        }
        .kku-dark-popup a.leaflet-popup-close-button {
          color: #8b9891 !important;
          padding: 6px !important;
        }
        .kku-dark-popup a.leaflet-popup-close-button:hover {
          color: #10b981 !important;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '520px',
          background: '#050806',
          position: 'relative',
          zIndex: 10
        }}
      />
    </>
  )
}
