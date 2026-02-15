'use client';

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GpsSnapshot } from '@/lib/api/gps';

// Default center: Casablanca
const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898];
const DEFAULT_ZOOM = 10;

// Marker colors by reason
const REASON_COLORS: Record<string, string> = {
  CHECK_IN: '#10B981',   // green
  CHECK_OUT: '#3B82F6',  // blue
  INCIDENT: '#EF4444',   // red
  MANUAL: '#6B7280',     // gray
};

const REASON_LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  INCIDENT: 'Incident',
  MANUAL: 'Manuel',
};

function createMarkerIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'gps-marker-icon',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><div style="
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'gps-user-icon',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #2563EB;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(37,99,235,0.2), 0 2px 8px rgba(0,0,0,0.3);
      animation: gps-pulse 2s ease-in-out infinite;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface GpsMapProps {
  snapshots: GpsSnapshot[];
  selectedVehicleId?: string | null;
  historyPoints?: GpsSnapshot[];
  userLocation?: { lat: number; lng: number } | null;
  onSnapshotClick?: (snapshot: GpsSnapshot) => void;
  height?: string;
}

export function GpsMap({
  snapshots,
  selectedVehicleId,
  historyPoints,
  userLocation,
  onSnapshotClick,
  height = '500px',
}: GpsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const polylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Filter out GPS-missing snapshots
  const validSnapshots = useMemo(() => {
    return snapshots.filter(
      (s) => !s.isGpsMissing && s.latitude !== 0 && s.longitude !== 0
    );
  }, [snapshots]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark-friendly tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current.addTo(map);
    mapRef.current = map;

    // Inject pulse animation CSS
    if (!document.getElementById('gps-map-styles')) {
      const style = document.createElement('style');
      style.id = 'gps-map-styles';
      style.textContent = `
        @keyframes gps-pulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(37,99,235,0.2), 0 2px 8px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 0 16px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.3); }
        }
        .gps-marker-icon, .gps-user-icon { background: transparent !important; border: none !important; }
        .leaflet-popup-content-wrapper { background: #1e293b; color: #e2e8f0; border-radius: 12px; border: 1px solid #334155; }
        .leaflet-popup-tip { background: #1e293b; }
        .leaflet-popup-content { margin: 12px 16px; font-size: 13px; line-height: 1.5; }
      `;
      document.head.appendChild(style);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when snapshots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.clearLayers();

    const displaySnapshots = selectedVehicleId
      ? validSnapshots.filter((s) => s.vehicleId === selectedVehicleId)
      : validSnapshots;

    if (displaySnapshots.length === 0) return;

    const bounds: [number, number][] = [];

    displaySnapshots.forEach((snapshot) => {
      const color = REASON_COLORS[snapshot.reason] || REASON_COLORS.MANUAL;
      const icon = createMarkerIcon(color);
      const marker = L.marker([snapshot.latitude, snapshot.longitude], { icon });

      const vehicleInfo = snapshot.vehicle
        ? `<strong>${snapshot.vehicle.brand} ${snapshot.vehicle.model}</strong><br/>${snapshot.vehicle.registrationNumber}`
        : snapshot.vehicleId
          ? `<em>Vehicule ID: ${snapshot.vehicleId.slice(0, 8)}...</em>`
          : '<em>Aucun vehicule</em>';

      const bookingInfo = snapshot.booking
        ? `<br/>Reservation: <strong>${snapshot.booking.bookingNumber}</strong>${snapshot.booking.client ? ` - ${snapshot.booking.client.name}` : ''}`
        : '';

      const popupContent = `
        <div>
          ${vehicleInfo}
          ${bookingInfo}
          <br/>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>
          <strong>${REASON_LABELS[snapshot.reason] || snapshot.reason}</strong>
          <br/>
          ${formatDate(snapshot.createdAt)}
          ${snapshot.accuracy ? `<br/>Precision: ${snapshot.accuracy.toFixed(0)}m` : ''}
          ${snapshot.mileage ? `<br/>Kilometrage: ${snapshot.mileage.toLocaleString()} km` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });

      if (onSnapshotClick) {
        marker.on('click', () => onSnapshotClick(snapshot));
      }

      marker.addTo(markersRef.current);
      bounds.push([snapshot.latitude, snapshot.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [validSnapshots, selectedVehicleId, onSnapshotClick]);

  // Draw history polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (!historyPoints || historyPoints.length < 2) return;

    const validHistory = historyPoints.filter(
      (s) => !s.isGpsMissing && s.latitude !== 0 && s.longitude !== 0
    );

    if (validHistory.length < 2) return;

    const points: [number, number][] = validHistory
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((s) => [s.latitude, s.longitude]);

    polylineRef.current = L.polyline(points, {
      color: '#3B82F6',
      weight: 3,
      opacity: 0.7,
      dashArray: '8, 6',
    }).addTo(map);

    map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
  }, [historyPoints]);

  // Show user location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!userLocation) return;

    const icon = createUserLocationIcon();
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon })
      .addTo(map)
      .bindPopup('<strong>Votre position</strong>')
      .openPopup();

    map.setView([userLocation.lat, userLocation.lng], 15);
  }, [userLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    />
  );
}
