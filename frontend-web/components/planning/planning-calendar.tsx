'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { planningApi, PlanningData } from '@/lib/api/planning';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlanningBoard } from './PlanningBoard';

interface PlanningCalendarProps {
  selectedAgencyId?: string | null;
}

export function PlanningCalendar({ selectedAgencyId }: PlanningCalendarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: string; end: string; resourceId?: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: Date; vehicleId?: string } | null>(null);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<Array<'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER'>>([]);
  const [search, setSearch] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useQuery<PlanningData>({
    queryKey: ['planning', selectedAgencyId],
    queryFn: () => planningApi.getPlanning({ agencyId: selectedAgencyId || undefined }),
  });

  const normalizeToKnownType = (value: any): 'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER' => {
    const raw = typeof value === 'string' ? value : '';
    const normalized = raw.trim().toUpperCase();
    if (normalized === 'BOOKING') return 'BOOKING';
    if (normalized === 'MAINTENANCE') return 'MAINTENANCE';
    if (normalized === 'PREPARATION_TIME') return 'PREPARATION_TIME';
    return 'OTHER';
  };

  // Extraire les marques uniques pour le filtre (spec: filtre par marque/modèle)
  const uniqueBrands = useMemo(() => {
    if (!data?.resources) return [];
    const brands = new Set<string>();
    data.resources.forEach((r) => {
      if (r.extendedProps?.brand) brands.add(r.extendedProps.brand);
    });
    return Array.from(brands).sort();
  }, [data?.resources]);

  // Extraire les statuts véhicules uniques (spec: filtre par statut véhicule)
  const uniqueStatuses = useMemo(() => {
    if (!data?.resources) return [];
    const statuses = new Set<string>();
    data.resources.forEach((r) => {
      if (r.extendedProps?.status) statuses.add(r.extendedProps.status);
    });
    return Array.from(statuses).sort();
  }, [data?.resources]);

  const calendarEvents = useMemo(() => {
    if (!data?.events) return [];

    // Créer un map des ressources pour éviter les recherches répétées
    const resourceMap = new Map(
      (data.resources || []).map((r) => [r.id, r])
    );

    return data.events
      .filter((event) => {
        if (vehicleId && event.resourceId !== vehicleId) return false;
        // Filtre par marque (spec)
        if (brandFilter) {
          const resource = resourceMap.get(event.resourceId);
          if (resource?.extendedProps?.brand !== brandFilter) return false;
        }
        // Filtre par statut véhicule (spec)
        if (statusFilter) {
          const resource = resourceMap.get(event.resourceId);
          if (resource?.extendedProps?.status !== statusFilter) return false;
        }
        const bucketType = normalizeToKnownType(event.extendedProps?.type);
        if (selectedTypes.length > 0 && !selectedTypes.includes(bucketType)) return false;
        const q = search.trim().toLowerCase();
        if (q) {
          const resource = resourceMap.get(event.resourceId);
          const vehicleTitle = resource?.title || '';
          const reg = resource?.extendedProps?.registrationNumber || '';
          const vehicleInfo = `${resource?.extendedProps?.brand || ''} ${resource?.extendedProps?.model || ''}`.trim();
          const bookingNumber = String(event.extendedProps?.bookingNumber || '');
          const haystack = `${event.title || ''} ${bookingNumber} ${vehicleTitle} ${vehicleInfo} ${reg}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .map((event) => {
        const resource = resourceMap.get(event.resourceId);
        const bucketType = normalizeToKnownType(event.extendedProps?.type);
        const shouldPrefixVehicle = bucketType !== 'BOOKING';
        const vehicleTitle = resource?.title || '';
        return {
          ...event,
          title: shouldPrefixVehicle && vehicleTitle ? `${vehicleTitle} • ${event.title}` : event.title,
          extendedProps: {
            ...event.extendedProps,
            vehicleInfo: resource
              ? `${resource.extendedProps.brand} ${resource.extendedProps.model}`
              : '',
          },
        };
      });
  }, [data?.events, data?.resources, vehicleId, selectedTypes, search, brandFilter, statusFilter]);

  const toggleType = (type: 'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER') => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', selectedAgencyId],
    queryFn: () => vehicleApi.getAll(selectedAgencyId || undefined),
    enabled: !!selectedAgencyId || showVehicleSelector,
  });


  const handleEventClick = (event: any) => {
    const eventType = event.extendedProps?.type;
    
    if (eventType === 'BOOKING' || eventType === 'booking') {
      const bookingId = event.extendedProps?.bookingId || event.id?.replace('booking-', '');
      if (bookingId) {
        router.push(`/agency/bookings/${bookingId}`);
      }
    } else if (eventType === 'MAINTENANCE' || eventType === 'maintenance') {
      const maintenanceId = event.extendedProps?.maintenanceId || event.id?.replace('maintenance-', '');
      if (maintenanceId) {
        router.push(`/agency/maintenance/${maintenanceId}`);
      }
    }
  };

  const handleContextMenu = (args: { date: Date; resourceId?: string; x: number; y: number }) => {
    setContextMenu({
      x: args.x,
      y: args.y,
      date: args.date,
      vehicleId: args.resourceId,
    });
  };

  const confirmCreateBooking = (vehicleId?: string) => {
    const finalVehicleId = vehicleId || selectedDateRange?.resourceId;
    if (selectedDateRange && finalVehicleId) {
      router.push(
        `/agency/bookings/new?startDate=${selectedDateRange.start}&endDate=${selectedDateRange.end}&vehicleId=${finalVehicleId}`
      );
      setSelectedDateRange(null);
      setShowVehicleSelector(false);
    }
  };

  const createMaintenance = (vehicleId: string, date: Date) => {
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(17, 0, 0, 0);
    
    router.push(
      `/agency/maintenance/new?vehicleId=${vehicleId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    setContextMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted">Chargement du planning...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-error">Erreur lors du chargement du planning</div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        {/* Header avec légende et filtres */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text mb-1">Planning</h2>
              <p className="text-sm text-text-muted">Visualisation complète des événements</p>
            </div>
            
            {/* Légende des événements */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-xs text-text-muted">Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-xs text-text-muted">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-xs text-text-muted">Préparation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span className="text-xs text-text-muted">Autres</span>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <label htmlFor="vehicle-filter" className="block text-sm font-medium text-text mb-1">
                Filtrer par véhicule
              </label>
              <select
                id="vehicle-filter"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
              >
                <option value="">Tous les véhicules</option>
                {vehicles?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber}
                  </option>
                ))}
              </select>
            </div>
            {/* Filtre par marque (spec) */}
            <div className="min-w-[150px]">
              <label htmlFor="brand-filter" className="block text-sm font-medium text-text mb-1">
                Marque
              </label>
              <select
                id="brand-filter"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
              >
                <option value="">Toutes</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Filtre par statut véhicule (spec) */}
            <div className="min-w-[150px]">
              <label htmlFor="status-filter" className="block text-sm font-medium text-text mb-1">
                Statut véhicule
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
              >
                <option value="">Tous</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-text">Type</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleType('BOOKING')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedTypes.includes('BOOKING')
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-card text-text hover:bg-background border border-border'
                  }`}
                >
                  Booking
                </button>
                <button
                  type="button"
                  onClick={() => toggleType('MAINTENANCE')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedTypes.includes('MAINTENANCE')
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-card text-text hover:bg-background border border-border'
                  }`}
                >
                  Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => toggleType('PREPARATION_TIME')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedTypes.includes('PREPARATION_TIME')
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-card text-text hover:bg-background border border-border'
                  }`}
                >
                  Prépa
                </button>
                <button
                  type="button"
                  onClick={() => toggleType('OTHER')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedTypes.includes('OTHER')
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-card text-text hover:bg-background border border-border'
                  }`}
                >
                  Autres
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-[240px] max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-text mb-1">
                Recherche
              </label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="BookingNumber, client, plaque, modèle..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
              />
            </div>

            {(vehicleId || selectedTypes.length > 0 || search.trim() || brandFilter || statusFilter) && (
              <button
                onClick={() => {
                  setVehicleId('');
                  setSelectedTypes([]);
                  setSearch('');
                  setBrandFilter('');
                  setStatusFilter('');
                }}
                className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-background"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Toolbar avec navigation et vues */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = new Date(currentDate);
                if (view === 'day') next.setDate(next.getDate() - 1);
                if (view === 'week') next.setDate(next.getDate() - 7);
                if (view === 'month') next.setMonth(next.getMonth() - 1);
                setCurrentDate(next);
              }}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-card text-text hover:bg-background border border-border"
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-card text-text hover:bg-background border border-border"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => {
                const next = new Date(currentDate);
                if (view === 'day') next.setDate(next.getDate() + 1);
                if (view === 'week') next.setDate(next.getDate() + 7);
                if (view === 'month') next.setMonth(next.getMonth() + 1);
                setCurrentDate(next);
              }}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-card text-text hover:bg-background border border-border"
            >
              ▶
            </button>
            <div className="px-3 py-2 text-sm font-semibold text-text">
              {currentDate.toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
                day: view === 'day' ? 'numeric' : undefined,
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'day'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-card text-text hover:bg-background border border-border'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'week'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-card text-text hover:bg-background border border-border'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'month'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-card text-text hover:bg-background border border-border'
              }`}
            >
              Mois
            </button>
          </div>
        </div>

        <PlanningBoard
          resources={data?.resources || []}
          events={calendarEvents}
          view={view}
          currentDate={currentDate}
          onChangeDate={setCurrentDate}
          onEventUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['planning'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
          }}
          onEventClick={handleEventClick}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* Dialog de sélection de véhicule */}
      <Dialog open={showVehicleSelector && !!selectedDateRange} onOpenChange={(open) => {
        if (!open) {
          setSelectedDateRange(null);
          setShowVehicleSelector(false);
        }
      }}>
        <DialogContent onClose={() => {
          setSelectedDateRange(null);
          setShowVehicleSelector(false);
        }}>
          <DialogHeader>
            <DialogTitle>Créer une réservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-text-muted">
              Du {new Date(selectedDateRange?.start || '').toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} au {new Date(selectedDateRange?.end || '').toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <div>
              <label htmlFor="vehicle-select" className="block text-sm font-medium text-text mb-2">
                Sélectionner un véhicule *
              </label>
              <select
                id="vehicle-select"
                value={selectedDateRange?.resourceId || ''}
                onChange={(e) => {
                  if (selectedDateRange) {
                    setSelectedDateRange({ ...selectedDateRange, resourceId: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.registrationNumber} ({vehicle.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedDateRange(null);
                setShowVehicleSelector(false);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => confirmCreateBooking(selectedDateRange?.resourceId)}
              disabled={!selectedDateRange?.resourceId}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu contextuel */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              if (contextMenu.vehicleId) {
                createMaintenance(contextMenu.vehicleId, contextMenu.date);
              } else {
                toast.error('Véhicule non identifié');
              }
            }}
            className="w-full text-left px-3 py-2 text-sm text-text hover:bg-background rounded"
          >
            🔧 Créer une maintenance
          </button>
          <button
            onClick={() => {
              setSelectedDateRange({
                start: contextMenu.date.toISOString(),
                end: new Date(contextMenu.date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                resourceId: contextMenu.vehicleId,
              });
              setShowVehicleSelector(true);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-text hover:bg-background rounded"
          >
            📅 Créer une réservation
          </button>
        </div>
      )}
      <style jsx global>{`
        .planning-board {
          overflow-x: auto;
        }
        .planning-grid {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 0;
          min-width: fit-content;
        }
        .planning-header {
          display: grid;
          gap: 4px;
        }
        .time-col-header {
          height: 36px;
        }
        .vehicle-col-header {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 150px;
        }
        .planning-body {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 4px;
        }
        .time-column {
          display: flex;
          flex-direction: column;
        }
        .time-slot {
          height: 24px;
          border-top: 1px solid var(--border);
          padding-top: 2px;
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .vehicles-columns {
          display: grid;
          gap: 4px;
        }
        .vehicle-column {
          position: relative;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          min-width: 150px;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 23px,
            var(--border) 23px,
            var(--border) 24px
          );
        }
        .event {
          position: absolute;
          left: 4px;
          right: 4px;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          color: white;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.15s ease, filter 0.15s ease;
          z-index: 2;
          border-left: 4px solid rgba(255,255,255,0.35);
        }
        .event.clickable:hover {
          filter: brightness(1.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transform: scale(1.02);
          z-index: 10;
        }
        .event.clickable:active {
          transform: scale(0.98);
        }
        .event.booking {
          background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
          border-left-color: #93c5fd;
        }
        .event.maintenance {
          background: linear-gradient(135deg, #EF4444 0%, #dc2626 100%);
          border-left-color: #fca5a5;
        }
        .event.preparation {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          border-left-color: #6ee7b7;
        }
        .event.other {
          background: linear-gradient(135deg, #6B7280 0%, #4b5563 100%);
          border-left-color: #d1d5db;
        }
        .event-title {
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .resize-handle {
          position: absolute;
          left: 0;
          right: 0;
          height: 6px;
          background: rgba(255, 255, 255, 0.4);
          cursor: ns-resize;
        }
        .resize-handle.top {
          top: 0;
        }
        .resize-handle.bottom {
          bottom: 0;
        }
        .planning-week {
          display: grid;
          gap: 8px;
        }
        .planning-week-header {
          display: grid;
          grid-template-columns: 220px repeat(7, 1fr);
          gap: 6px;
        }
        .week-spacer {
          height: 28px;
        }
        .week-day-header {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px;
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }
        .planning-week-body {
          display: grid;
          gap: 6px;
        }
        .week-row {
          display: grid;
          grid-template-columns: 220px repeat(7, 1fr);
          gap: 6px;
        }
        .week-resource {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px;
          font-size: 12px;
          color: var(--text);
        }
        .week-cell {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px;
          min-height: 70px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          position: relative;
          overflow: hidden;
          transition: background 0.15s ease;
        }
        .week-cell:hover {
          background: color-mix(in srgb, var(--card) 90%, var(--primary) 10%);
        }
        .week-cell .event {
          position: relative;
          left: auto;
          right: auto;
          top: auto;
          font-size: 11px;
          padding: 4px 6px;
          border-radius: 4px;
          border-left-width: 3px;
          cursor: pointer;
        }
        .week-cell .event .event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .planning-month .month-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-bottom: 6px;
        }
        .planning-month .month-header-day {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          padding: 4px;
        }
        .planning-month .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .month-cell {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px;
          min-height: 90px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          overflow: hidden;
          transition: background 0.15s ease;
        }
        .month-cell:hover {
          background: color-mix(in srgb, var(--card) 90%, var(--primary) 10%);
        }
        .month-cell .event {
          position: relative;
          left: auto;
          right: auto;
          top: auto;
          font-size: 10px;
          padding: 3px 5px;
          border-radius: 4px;
          border-left-width: 3px;
          cursor: pointer;
        }
        .month-cell .event .event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .month-cell.muted {
          opacity: 0.4;
        }
        .month-date {
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
