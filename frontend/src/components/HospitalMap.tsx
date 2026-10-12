import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface HospitalPin {
  id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  rating: number;
  has_nexora_doctors?: boolean;
}

interface HospitalMapProps {
  hospitals: HospitalPin[];
  selectedHospitalId?: string;
  onSelectHospital: (id: string) => void;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map centered on Kolhapur
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([16.705, 74.2433], 13);

      // OpenStreetMap tiles for clean, crisp, keyless presentation
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Custom Royal Cobalt Blue Pin (Wix Doctor Palette)
    const defaultIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background: #00329A;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 50, 154, 0.4);
        ">
          <div style="
            transform: rotate(45deg);
            color: #FFFFFF;
            font-weight: 700;
            font-size: 13px;
          ">H</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const activeIcon = L.divIcon({
      className: 'custom-map-pin-active',
      html: `
        <div style="
          background: #15803D;
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(21, 128, 61, 0.5);
        ">
          <div style="
            transform: rotate(45deg);
            color: #FFFFFF;
            font-weight: 800;
            font-size: 16px;
          ">&#10003;</div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    hospitals.forEach((hosp) => {
      const isSelected = hosp.id === selectedHospitalId;
      const marker = L.marker([hosp.latitude, hosp.longitude], {
        icon: isSelected ? activeIcon : defaultIcon,
      }).addTo(map);

      const popupHtml = `
        <div style="padding: 4px; min-width: 190px;">
          <h6 style="margin: 0 0 4px; font-weight: 700; color: #0F172A; font-size: 14px;">${hosp.name}</h6>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">${hosp.formatted_address}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: #B45309;">&#9733; ${hosp.rating}</span>
            <button id="pin-btn-${hosp.id}" style="
              background: #00329A;
              border: none;
              color: #FFFFFF;
              padding: 5px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
            ">View & Book</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`pin-btn-${hosp.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectHospital(hosp.id);
          };
        }
      });

      markersRef.current[hosp.id] = marker;
    });

    // If a hospital is selected, center map on it
    if (selectedHospitalId) {
      const active = hospitals.find((h) => h.id === selectedHospitalId);
      if (active) {
        map.setView([active.latitude, active.longitude], 15, { animate: true });
        if (markersRef.current[active.id]) {
          markersRef.current[active.id].openPopup();
        }
      }
    }
  }, [hospitals, selectedHospitalId, onSelectHospital]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '650px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
};
