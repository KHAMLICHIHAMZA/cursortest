'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gpsApi, GpsSnapshot, GpsFilters, GpsSnapshotReason } from '@/lib/api/gps';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { GpsLocationButton } from '@/components/gps/GpsLocationButton';
import { GpsHistory } from '@/components/gps/GpsHistory';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { authApi } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import Cookies from 'js-cookie';

// Load GpsMap dynamically to avoid SSR issues with Leaflet
const GpsMap = dynamic(
  () => import('@/components/gps/GpsMap').then((m) => m.GpsMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center bg-card rounded-xl border border-border" style={{ height: '500px' }}><span className="text-text-muted">Chargement de la carte...</span></div> }
);

const REASON_OPTIONS: { value: GpsSnapshotReason | ''; label: string }[] = [
  { value: '', label: 'Toutes les raisons' },
  { value: 'CHECK_IN', label: 'Check-in' },
  { value: 'CHECK_OUT', label: 'Check-out' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'MANUAL', label: 'Manuel' },
];

const REASON_COLORS: Record<string, string> = {
  CHECK_IN: '#10B981',
  CHECK_OUT: '#3B82F6',
  INCIDENT: '#EF4444',
  MANUAL: '#6B7280',
};

const REASON_LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  INCIDENT: 'Incident',
  MANUAL: 'Manuel',
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

export default function GpsPage() {
  const queryClient = useQueryClient();

  // User info
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const agencyId = user?.agencyIds?.[0] || '';

  // Filters
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // State
  const [historyVehicleId, setHistoryVehicleId] = useState<string | null>(null);
  const [historyPoints, setHistoryPoints] = useState<GpsSnapshot[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Tracker state
  const [showTrackerPanel, setShowTrackerPanel] = useState(false);
  const [trackerIdInput, setTrackerIdInput] = useState('');
  const [trackerLabelInput, setTrackerLabelInput] = useState('');
  const [savingTracker, setSavingTracker] = useState(false);

  // Vehicles for filter dropdown
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', agencyId],
    queryFn: () => vehicleApi.getAll(agencyId || undefined),
    enabled: !!agencyId,
  });

  // GPS snapshots
  const filters: GpsFilters = useMemo(() => ({
    agencyId: agencyId || undefined,
    reason: (selectedReason as GpsSnapshotReason) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 200,
  }), [agencyId, selectedReason, dateFrom, dateTo]);

  const { data: snapshots, isLoading } = useQuery<GpsSnapshot[]>({
    queryKey: ['gps-snapshots', filters],
    queryFn: () => gpsApi.getSnapshots(filters),
    enabled: !!agencyId,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const allSnapshots = snapshots ?? [];

  // Filter by vehicle on the frontend side too (for instant filtering)
  const displaySnapshots = useMemo(() => {
    if (!selectedVehicleId) return allSnapshots;
    return allSnapshots.filter((s) => s.vehicleId === selectedVehicleId);
  }, [allSnapshots, selectedVehicleId]);

  // Latest snapshot per vehicle (for the list)
  const latestPerVehicle = useMemo(() => {
    const map = new Map<string, GpsSnapshot>();
    allSnapshots.forEach((s) => {
      if (!s.vehicleId || s.isGpsMissing) return;
      const existing = map.get(s.vehicleId);
      if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
        map.set(s.vehicleId, s);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allSnapshots]);

  const handleSnapshotCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gps-snapshots'] });
  }, [queryClient]);

  const handleLocationCaptured = useCallback((loc: { lat: number; lng: number }) => {
    setUserLocation(loc);
  }, []);

  const handleSelectVehicle = useCallback((vehicleId: string) => {
    if (historyVehicleId === vehicleId) {
      // Toggle off
      setHistoryVehicleId(null);
      setHistoryPoints([]);
    } else {
      setHistoryVehicleId(vehicleId);
      setHistoryPoints([]);
    }
  }, [historyVehicleId]);

  const handleHistoryPointsLoaded = useCallback((points: GpsSnapshot[]) => {
    setHistoryPoints(points);
  }, []);

  // Vehicle lookup
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles?.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicleMap.get(vehicleId);
    return v ? `${v.brand} ${v.model} - ${v.registrationNumber}` : vehicleId.slice(0, 8);
  };

  // Selected vehicle object
  const selectedVehicle = selectedVehicleId ? vehicleMap.get(selectedVehicleId) : null;

  // Open tracker panel for selected vehicle
  const openTrackerPanel = useCallback(() => {
    if (!selectedVehicle) return;
    setTrackerIdInput((selectedVehicle as any).gpsTrackerId || '');
    setTrackerLabelInput((selectedVehicle as any).gpsTrackerLabel || '');
    setShowTrackerPanel(true);
  }, [selectedVehicle]);

  // Save tracker info
  const saveTracker = useCallback(async () => {
    if (!selectedVehicleId) return;
    setSavingTracker(true);
    try {
      await apiClient.patch(`/vehicles/${selectedVehicleId}`, {
        gpsTrackerId: trackerIdInput || null,
        gpsTrackerLabel: trackerLabelInput || null,
      });
      toast.success('Tracker mis a jour');
      setShowTrackerPanel(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise a jour du tracker');
    } finally {
      setSavingTracker(false);
    }
  }, [selectedVehicleId, trackerIdInput, trackerLabelInput, queryClient]);

  // Unlink tracker
  const unlinkTracker = useCallback(async () => {
    if (!selectedVehicleId) return;
    setSavingTracker(true);
    try {
      await apiClient.patch(`/vehicles/${selectedVehicleId}`, {
        gpsTrackerId: null,
        gpsTrackerLabel: null,
      });
      toast.success('Tracker dissocie');
      setTrackerIdInput('');
      setTrackerLabelInput('');
      setShowTrackerPanel(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch {
      toast.error('Erreur lors de la dissociation');
    } finally {
      setSavingTracker(false);
    }
  }, [selectedVehicleId, queryClient]);

  const resetFilters = () => {
    setSelectedVehicleId('');
    setSelectedReason('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = selectedVehicleId || selectedReason || dateFrom || dateTo;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-text mb-1">GPS</h1>
            <p className="text-text-muted text-sm">
              Visualisez les positions GPS de vos vehicules et capturez de nouvelles positions
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px] max-w-xs">
                <label htmlFor="gps-vehicle" className="block text-xs font-medium text-text mb-1">
                  Vehicule
                </label>
                <select
                  id="gps-vehicle"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">Tous les vehicules</option>
                  {vehicles?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} - {v.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>
              {selectedVehicleId && (
                <div className="flex gap-2 pb-0.5">
                  <button
                    onClick={() => setShowTrackerPanel(true)}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                    title="Localiser le vehicule"
                  >
                    Localiser
                  </button>
                  <button
                    onClick={() => setShowTrackerPanel(true)}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-border text-text hover:bg-background transition-colors"
                    title="Gerer le tracker GPS"
                  >
                    Tracker
                  </button>
                </div>
              )}
              <div className="min-w-[160px]">
                <label htmlFor="gps-reason" className="block text-xs font-medium text-text mb-1">
                  Raison
                </label>
                <select
                  id="gps-reason"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <label htmlFor="gps-from" className="block text-xs font-medium text-text mb-1">
                  Du
                </label>
                <input
                  id="gps-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                />
              </div>
              <div className="min-w-[140px]">
                <label htmlFor="gps-to" className="block text-xs font-medium text-text mb-1">
                  Au
                </label>
                <input
                  id="gps-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                />
              </div>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Reinitialiser
                </button>
              )}
              <div className="text-xs text-text-muted py-2">
                {displaySnapshots.length} point(s) GPS
              </div>
            </div>
          </div>

          {/* Map + History side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`relative ${historyVehicleId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {isLoading ? (
                <div className="flex items-center justify-center bg-card rounded-xl border border-border" style={{ height: '500px' }}>
                  <span className="text-text-muted">Chargement des points GPS...</span>
                </div>
              ) : (
                <GpsMap
                  snapshots={displaySnapshots}
                  selectedVehicleId={selectedVehicleId || null}
                  historyPoints={historyVehicleId ? historyPoints : undefined}
                  userLocation={userLocation}
                  onSnapshotClick={(s) => s.vehicleId && handleSelectVehicle(s.vehicleId)}
                  height="500px"
                />
              )}
              {agencyId && (
                <GpsLocationButton
                  agencyId={agencyId}
                  vehicleId={selectedVehicleId || undefined}
                  reason="MANUAL"
                  onLocationCaptured={handleLocationCaptured}
                  onSnapshotCreated={handleSnapshotCreated}
                />
              )}
            </div>

            {/* History panel */}
            {historyVehicleId && (
              <div className="lg:col-span-1">
                <GpsHistory
                  vehicleId={historyVehicleId}
                  vehicleLabel={getVehicleLabel(historyVehicleId)}
                  onPointsLoaded={handleHistoryPointsLoaded}
                  onClose={() => {
                    setHistoryVehicleId(null);
                    setHistoryPoints([]);
                  }}
                />
              </div>
            )}
          </div>

          {/* Latest positions per vehicle */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-bold text-text mb-4">
              Dernieres positions par vehicule
            </h2>
            {latestPerVehicle.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">
                Aucune position GPS enregistree
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted">
                      <th className="text-left py-2 px-3 font-medium">Vehicule</th>
                      <th className="text-left py-2 px-3 font-medium">Raison</th>
                      <th className="text-left py-2 px-3 font-medium">Position</th>
                      <th className="text-left py-2 px-3 font-medium">Precision</th>
                      <th className="text-left py-2 px-3 font-medium">Kilometrage</th>
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-left py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestPerVehicle.map((snapshot) => {
                      const color = REASON_COLORS[snapshot.reason] || REASON_COLORS.MANUAL;
                      const isSelected = historyVehicleId === snapshot.vehicleId;
                      return (
                        <tr
                          key={snapshot.id}
                          className={`border-b border-border/50 hover:bg-background transition-colors ${
                            isSelected ? 'bg-primary/10' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-medium text-text">
                            {snapshot.vehicleId ? getVehicleLabel(snapshot.vehicleId) : '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ background: color }}
                              />
                              <span className="text-text">
                                {REASON_LABELS[snapshot.reason] || snapshot.reason}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-text-muted font-mono text-xs">
                            {snapshot.latitude.toFixed(5)}, {snapshot.longitude.toFixed(5)}
                          </td>
                          <td className="py-3 px-3 text-text-muted">
                            {snapshot.accuracy ? `${snapshot.accuracy.toFixed(0)}m` : '-'}
                          </td>
                          <td className="py-3 px-3 text-text-muted">
                            {snapshot.mileage ? `${snapshot.mileage.toLocaleString()} km` : '-'}
                          </td>
                          <td className="py-3 px-3 text-text-muted">
                            {formatDate(snapshot.createdAt)}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => snapshot.vehicleId && handleSelectVehicle(snapshot.vehicleId)}
                              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'bg-card text-text-muted hover:text-text border border-border hover:bg-background'
                              }`}
                            >
                              {isSelected ? 'Masquer' : 'Historique'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Tracker Panel Modal — En cours de développement */}
        {showTrackerPanel && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="8" rx="1" />
                    <path d="M17 14v7" />
                    <path d="M7 14v7" />
                    <path d="M17 3v3" />
                    <path d="M7 3v3" />
                    <path d="M10 14 2.3 6.3" />
                    <path d="m14 6 7.7 7.7" />
                    <path d="m8 6 8 8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">
                    Fonctionnalité en cours de développement
                  </h3>
                  <p className="text-sm text-text-muted mt-3 leading-relaxed">
                    L&apos;association des <strong className="text-text">boîtiers GPS physiques</strong> aux véhicules sera disponible prochainement.
                  </p>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">
                    Cette fonctionnalité permettra de connecter vos trackers GPS (mini GPS, AirTag, etc.) pour suivre vos véhicules en temps réel.
                  </p>
                </div>
                <div className="w-full rounded-lg bg-background border border-border p-4 text-left space-y-2">
                  <p className="text-xs font-semibold text-text uppercase tracking-wide">À venir</p>
                  <ul className="text-sm text-text-muted space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      Association tracker ↔ véhicule
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      Suivi en temps réel sur la carte
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      Historique des trajets
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      Alertes de géofencing
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowTrackerPanel(false)}
                  className="mt-1 px-8 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </RouteGuard>
  );
}
