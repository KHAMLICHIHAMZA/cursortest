'use client';

import { useState, useCallback } from 'react';
import { gpsApi, GpsSnapshotReason, GpsMissingReason } from '@/lib/api/gps';
import { toast } from '@/components/ui/toast';

interface GpsLocationButtonProps {
  agencyId: string;
  vehicleId?: string;
  bookingId?: string;
  reason?: GpsSnapshotReason;
  onLocationCaptured?: (location: { lat: number; lng: number }) => void;
  onSnapshotCreated?: () => void;
}

export function GpsLocationButton({
  agencyId,
  vehicleId,
  bookingId,
  reason = 'MANUAL',
  onLocationCaptured,
  onSnapshotCreated,
}: GpsLocationButtonProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalisation n\'est pas supportee par votre navigateur');
      // Report GPS missing
      try {
        await gpsApi.reportMissing({
          agencyId,
          vehicleId,
          bookingId,
          reason,
          gpsMissingReason: 'deviceUnsupported',
        });
      } catch { /* ignore */ }
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude, accuracy, altitude } = position.coords;

      onLocationCaptured?.({ lat: latitude, lng: longitude });

      // Send to backend
      await gpsApi.captureSnapshot({
        agencyId,
        vehicleId,
        bookingId,
        latitude,
        longitude,
        accuracy: accuracy ?? undefined,
        altitude: altitude ?? undefined,
        reason,
        deviceInfo: navigator.userAgent,
      });

      toast.success(
        `Position capturee (precision: ${accuracy ? accuracy.toFixed(0) + 'm' : 'inconnue'})`
      );
      onSnapshotCreated?.();
    } catch (error: any) {
      // GeolocationPositionError
      if (error?.code) {
        let missingReason: GpsMissingReason = 'offline';
        let userMessage = 'Impossible d\'obtenir la position GPS';

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            missingReason = 'permissionDenied';
            userMessage = 'Acces a la position refuse. Autorisez la geolocalisation dans les parametres.';
            break;
          case 2: // POSITION_UNAVAILABLE
            missingReason = 'offline';
            userMessage = 'Position GPS indisponible. Verifiez votre connexion.';
            break;
          case 3: // TIMEOUT
            missingReason = 'offline';
            userMessage = 'Delai d\'attente GPS depasse. Reessayez.';
            break;
        }

        toast.error(userMessage);

        // Report GPS missing
        try {
          await gpsApi.reportMissing({
            agencyId,
            vehicleId,
            bookingId,
            reason,
            gpsMissingReason: missingReason,
          });
        } catch { /* ignore */ }
      } else {
        // API error
        const msg = error?.response?.data?.message || error?.message || 'Erreur lors de la capture GPS';
        toast.error(typeof msg === 'string' ? msg : 'Erreur lors de la capture GPS');
      }
    } finally {
      setIsLocating(false);
    }
  }, [agencyId, vehicleId, bookingId, reason, onLocationCaptured, onSnapshotCreated]);

  return (
    <button
      onClick={handleLocate}
      disabled={isLocating}
      className="gps-locate-btn"
      title="Capturer la position GPS"
    >
      {isLocating ? (
        <svg className="gps-locate-spinner" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      )}
      <style jsx>{`
        .gps-locate-btn {
          position: absolute;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #2563EB;
          color: white;
          border: 3px solid white;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .gps-locate-btn:hover:not(:disabled) {
          transform: scale(1.1);
          background: #1d4ed8;
        }
        .gps-locate-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        .gps-locate-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .gps-locate-spinner {
          animation: gps-spin 1s linear infinite;
        }
        @keyframes gps-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
