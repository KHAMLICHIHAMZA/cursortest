'use client';

import { useQuery } from '@tanstack/react-query';
import { gpsApi, GpsSnapshot } from '@/lib/api/gps';

const REASON_LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  INCIDENT: 'Incident',
  MANUAL: 'Manuel',
};

const REASON_COLORS: Record<string, string> = {
  CHECK_IN: '#10B981',
  CHECK_OUT: '#3B82F6',
  INCIDENT: '#EF4444',
  MANUAL: '#6B7280',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface GpsHistoryProps {
  vehicleId: string;
  vehicleLabel?: string;
  onPointsLoaded?: (points: GpsSnapshot[]) => void;
  onClose?: () => void;
}

export function GpsHistory({ vehicleId, vehicleLabel, onPointsLoaded, onClose }: GpsHistoryProps) {
  const { data: snapshots, isLoading } = useQuery<GpsSnapshot[]>({
    queryKey: ['gps-vehicle', vehicleId],
    queryFn: () => gpsApi.getVehicleSnapshots(vehicleId),
    enabled: !!vehicleId,
  });

  // Notify parent about loaded points (for polyline drawing)
  const validPoints = snapshots?.filter(
    (s) => !s.isGpsMissing && s.latitude !== 0 && s.longitude !== 0
  ) ?? [];

  // Call onPointsLoaded when data changes
  if (validPoints.length > 0 && onPointsLoaded) {
    onPointsLoaded(validPoints);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text">
            Historique GPS
          </h3>
          {vehicleLabel && (
            <p className="text-xs text-text-muted">{vehicleLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{validPoints.length} point(s)</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors text-lg leading-none px-1"
              title="Fermer l'historique"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-text-muted text-sm">
          Chargement de l'historique...
        </div>
      ) : snapshots && snapshots.length === 0 ? (
        <div className="text-center py-4 text-text-muted text-sm">
          Aucun point GPS pour ce vehicule
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {snapshots?.map((snapshot) => {
            const color = REASON_COLORS[snapshot.reason] || REASON_COLORS.MANUAL;
            return (
              <div
                key={snapshot.id}
                className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-background transition-colors"
              >
                <div
                  className="mt-1 flex-shrink-0 w-3 h-3 rounded-full"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text">
                      {REASON_LABELS[snapshot.reason] || snapshot.reason}
                    </span>
                    {snapshot.isGpsMissing && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                        GPS manquant
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {formatDate(snapshot.createdAt)}
                  </p>
                  {!snapshot.isGpsMissing && (
                    <p className="text-[11px] text-text-muted">
                      {snapshot.latitude.toFixed(5)}, {snapshot.longitude.toFixed(5)}
                      {snapshot.accuracy ? ` (${snapshot.accuracy.toFixed(0)}m)` : ''}
                    </p>
                  )}
                  {snapshot.mileage && (
                    <p className="text-[11px] text-text-muted">
                      {snapshot.mileage.toLocaleString()} km
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
