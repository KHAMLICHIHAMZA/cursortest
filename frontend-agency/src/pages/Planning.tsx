import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { X } from 'lucide-react';
import { PlanningBoard } from '../components/PlanningBoard';

export default function Planning() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<Array<'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER'>>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const queryClient = useQueryClient();

  useEffect(() => {
    const base = new Date(currentDate);
    if (view === 'day') {
      setStart(new Date(base));
      setEnd(new Date(base));
    } else if (view === 'week') {
      const dayIndex = (base.getDay() + 6) % 7;
      const weekStart = new Date(base);
      weekStart.setDate(base.getDate() - dayIndex);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      setStart(weekStart);
      setEnd(weekEnd);
    } else {
      const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      setStart(monthStart);
      setEnd(monthEnd);
    }
  }, [currentDate, view]);

  const { data: agencies } = useQuery({
    queryKey: ['agencies'], 
    queryFn: async () => {
      const res = await api.get('/agencies');
      return res.data;
    },
  });

  const { data: planningData, isLoading } = useQuery({
    queryKey: ['planning', start, end, selectedAgency],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      if (selectedAgency) {
        params.append('agencyId', selectedAgency);
      }
      const res = await api.get(`/planning?${params}`);
      return res.data;
    },
  });

  const resourceMap = useMemo(() => {
    const entries = (planningData?.resources || []).map((resource: any) => [
      resource.id,
      resource.title,
    ]);
    return new Map<string, string>(entries);
  }, [planningData]);

  const vehicleOptions = useMemo(() => {
    return (planningData?.resources || []).map((resource: any) => ({
      id: resource.id,
      title: resource.title,
    }));
  }, [planningData]);

  const normalizeToKnownType = (value: any): 'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER' => {
    const raw = typeof value === 'string' ? value : '';
    const normalized = raw.trim().toUpperCase();
    if (normalized === 'BOOKING') return 'BOOKING';
    if (normalized === 'MAINTENANCE') return 'MAINTENANCE';
    if (normalized === 'PREPARATION_TIME') return 'PREPARATION_TIME';
    return 'OTHER';
  };

  const displayEvents = useMemo(() => {
    const events = planningData?.events || [];
    const filtered = selectedVehicle
      ? events.filter((event: any) => event.resourceId === selectedVehicle)
      : events;

    const mapped = filtered.map((event: any) => {
      const vehicleTitle = resourceMap.get(event.resourceId) || '';
      const bucketType = normalizeToKnownType(event.extendedProps?.type);
      const shouldPrefixVehicle = bucketType !== 'BOOKING';
      return {
        ...event,
        title: shouldPrefixVehicle && vehicleTitle
          ? `${vehicleTitle} • ${event.title}`
          : event.title,
      };
    });

    const activeSearch = search.trim().toLowerCase();
    return mapped.filter((event: any) => {
      const bucketType = normalizeToKnownType(event.extendedProps?.type);
      if (selectedTypes.length > 0 && !selectedTypes.includes(bucketType)) return false;
      if (!activeSearch) return true;
      const vehicleTitle = resourceMap.get(event.resourceId) || '';
      const bookingNumber = String(event.extendedProps?.bookingNumber || '');
      const haystack = `${event.title || ''} ${vehicleTitle} ${bookingNumber}`.toLowerCase();
      return haystack.includes(activeSearch);
    });
  }, [planningData, selectedVehicle, resourceMap, selectedTypes, search]);

  const filteredResources = useMemo(() => {
    const resources = planningData?.resources || [];
    if (selectedVehicle) {
      return resources.filter((r: any) => r.id === selectedVehicle);
    }
    if (selectedTypes.length === 0 && !search.trim()) {
      return resources;
    }
    const allowed = new Set(displayEvents.map((e: any) => e.resourceId));
    return resources.filter((r: any) => allowed.has(r.id));
  }, [planningData, selectedVehicle, selectedTypes, search, displayEvents]);

  const toggleType = (type: 'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER') => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const { data: bookingDetails } = useQuery({
    queryKey: ['booking', selectedEvent?.bookingId],
    queryFn: async () => {
      if (selectedEvent?.type === 'BOOKING' && selectedEvent?.bookingId) {
        const res = await api.get(`/bookings/${selectedEvent.bookingId}`);
        return res.data;
      }
      return null;
    },
    enabled: selectedEvent?.type === 'BOOKING' && !!selectedEvent?.bookingId,
  });

  const { data: maintenanceDetails } = useQuery({
    queryKey: ['maintenance', selectedEvent?.maintenanceId],
    queryFn: async () => {
      if (selectedEvent?.type === 'MAINTENANCE' && selectedEvent?.maintenanceId) {
        const res = await api.get(`/maintenance/${selectedEvent.maintenanceId}`);
        return res.data;
      }
      return null;
    },
    enabled: selectedEvent?.type === 'MAINTENANCE' && !!selectedEvent?.maintenanceId,
  });

  const handleEventClick = (event: any) => {
    const extendedProps = event.extendedProps || {};
    
    // Ouvrir la modal pour les bookings, maintenances et événements de planning
    if (extendedProps.type === 'BOOKING' || extendedProps.type === 'MAINTENANCE' || extendedProps.type === 'PREPARATION_TIME') {
      setSelectedEvent({
        ...extendedProps,
        bookingId: extendedProps.bookingId || extendedProps.eventId,
        maintenanceId: extendedProps.maintenanceId || extendedProps.eventId,
      });
      setShowEventModal(true);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Planning</h1>
        <div className="flex gap-3 items-center flex-wrap justify-end">
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="px-4 py-2 bg-[#1B1F2A] border border-[#2A3241] rounded-lg text-white shadow-sm"
          >
            <option value="">Toutes les agences</option>
            {agencies?.map((agency: any) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="px-4 py-2 bg-[#1B1F2A] border border-[#2A3241] rounded-lg text-white shadow-sm"
          >
            <option value="">Tous les véhicules</option>
            {vehicleOptions.map((vehicle: any) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.title}
              </option>
            ))}
          </select>

          <div className="flex gap-2 items-center">
            <button
              className={`planning-filter-btn ${selectedTypes.includes('BOOKING') ? 'active' : ''}`}
              onClick={() => toggleType('BOOKING')}
              type="button"
            >
              Booking
            </button>
            <button
              className={`planning-filter-btn ${selectedTypes.includes('MAINTENANCE') ? 'active' : ''}`}
              onClick={() => toggleType('MAINTENANCE')}
              type="button"
            >
              Maintenance
            </button>
            <button
              className={`planning-filter-btn ${selectedTypes.includes('PREPARATION_TIME') ? 'active' : ''}`}
              onClick={() => toggleType('PREPARATION_TIME')}
              type="button"
            >
              Prépa
            </button>
            <button
              className={`planning-filter-btn ${selectedTypes.includes('OTHER') ? 'active' : ''}`}
              onClick={() => toggleType('OTHER')}
              type="button"
            >
              Autres
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (BookingNumber, client, plaque, modèle...)"
            className="px-4 py-2 bg-[#1B1F2A] border border-[#2A3241] rounded-lg text-white shadow-sm min-w-[260px]"
          />

          {(selectedVehicle || selectedTypes.length > 0 || search.trim()) && (
            <button
              type="button"
              className="planning-btn"
              onClick={() => {
                setSelectedVehicle('');
                setSelectedTypes([]);
                setSearch('');
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1B1F2A] rounded-xl border border-[#2A3241] p-4 shadow-lg">
        {isLoading ? (
          <div className="text-center py-8">Chargement du planning...</div>
        ) : (
          <div className="planning-container">
            <div className="planning-toolbar">
              <div className="planning-nav">
                <button
                  className="planning-btn"
                  onClick={() => {
                    const next = new Date(currentDate);
                    if (view === 'day') next.setDate(next.getDate() - 1);
                    if (view === 'week') next.setDate(next.getDate() - 7);
                    if (view === 'month') next.setMonth(next.getMonth() - 1);
                    setCurrentDate(next);
                  }}
                >
                  ◀
                </button>
                <button
                  className="planning-btn"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Aujourd'hui
                </button>
                <button
                  className="planning-btn"
                  onClick={() => {
                    const next = new Date(currentDate);
                    if (view === 'day') next.setDate(next.getDate() + 1);
                    if (view === 'week') next.setDate(next.getDate() + 7);
                    if (view === 'month') next.setMonth(next.getMonth() + 1);
                    setCurrentDate(next);
                  }}
                >
                  ▶
                </button>
              </div>
              <div className="planning-title">
                {currentDate.toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                  day: view === 'day' ? 'numeric' : undefined,
                })}
              </div>
              <div className="planning-views">
                <button
                  className={`planning-btn ${view === 'day' ? 'active' : ''}`}
                  onClick={() => setView('day')}
                >
                  Jour
                </button>
                <button
                  className={`planning-btn ${view === 'week' ? 'active' : ''}`}
                  onClick={() => setView('week')}
                >
                  Semaine
                </button>
                <button
                  className={`planning-btn ${view === 'month' ? 'active' : ''}`}
                  onClick={() => setView('month')}
                >
                  Mois
                </button>
              </div>
            </div>

            <PlanningBoard
              resources={filteredResources}
              events={displayEvents}
              view={view}
              currentDate={currentDate}
              onChangeDate={(next) => setCurrentDate(next)}
              onEventUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ['planning'] });
              }}
              onEventClick={handleEventClick}
            />
          </div>
        )}
      </div>

      <style>{`
        .planning-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 10px;
          background: linear-gradient(180deg, #1A1F2B 0%, #171B24 100%);
          border: 1px solid #2A3241;
          margin-bottom: 16px;
          color: #E5E7EB;
        }
        .planning-nav,
        .planning-views {
          display: flex;
          gap: 8px;
        }
        .planning-btn {
          background-color: #2563EB;
          border: 1px solid #2563EB;
          color: white;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
        }
        .planning-btn.active {
          background-color: #1E40AF;
          border-color: #1E40AF;
        }
        .planning-filter-btn {
          background-color: #111827;
          border: 1px solid #2A3241;
          color: #E5E7EB;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
        }
        .planning-filter-btn.active {
          background-color: #2563EB;
          border-color: #2563EB;
          color: white;
        }
        .planning-title {
          font-weight: 600;
          text-transform: capitalize;
        }
        .planning-grid {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 8px;
        }
        .planning-header {
          display: grid;
          grid-template-columns: 80px repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
        }
        .time-col-header {
          height: 28px;
        }
        .vehicle-col-header {
          background: #111827;
          border: 1px solid #2A3241;
          border-radius: 8px;
          padding: 8px;
          font-size: 12px;
          color: #9CA3AF;
          text-align: center;
        }
        .planning-body {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 8px;
        }
        .time-column {
          display: grid;
          grid-template-rows: repeat(33, 24px);
          font-size: 11px;
          color: #A1A1AA;
        }
        .time-slot {
          border-top: 1px solid #1F2937;
          padding-top: 2px;
        }
        .vehicles-columns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
        }
        .vehicle-column {
          position: relative;
          background: #151A24;
          border: 1px solid #2A3241;
          border-radius: 8px;
          overflow: hidden;
        }
        .event {
          position: absolute;
          left: 8px;
          right: 8px;
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 11px;
          color: white;
          cursor: pointer;
        }
        .event.booking {
          background: #2563EB;
        }
        .event.maintenance {
          background: #EF4444;
        }
        .event.preparation {
          background: #10B981;
        }
        .event.other {
          background: #6B7280;
        }
        .event-title {
          font-weight: 600;
          line-height: 1.2;
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
          background: #111827;
          border: 1px solid #2A3241;
          border-radius: 8px;
          padding: 6px;
          font-size: 12px;
          color: #9CA3AF;
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
          background: #151A24;
          border: 1px solid #2A3241;
          border-radius: 8px;
          padding: 8px;
          font-size: 12px;
          color: #E5E7EB;
        }
        .week-cell {
          background: #151A24;
          border: 1px solid #2A3241;
          border-radius: 8px;
          padding: 4px;
          min-height: 60px;
          display: grid;
          gap: 4px;
          position: relative;
        }
        .week-cell-overlay {
          position: absolute;
          inset: 0;
        }
        .planning-month .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .month-cell {
          background: #151A24;
          border: 1px solid #2A3241;
          border-radius: 8px;
          padding: 6px;
          min-height: 90px;
          display: grid;
          gap: 4px;
        }
        .month-cell.muted {
          opacity: 0.4;
        }
        .month-date {
          font-size: 12px;
          color: #9CA3AF;
        }
      `}</style>

      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEventModal(false);
            setSelectedEvent(null);
          }
        }}>
          <div className="bg-[#2C2F36] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedEvent.type === 'BOOKING' 
                  ? '📍 Détails de la location' 
                  : selectedEvent.type === 'MAINTENANCE'
                  ? '🔧 Détails de la maintenance'
                  : selectedEvent.type === 'PREPARATION_TIME'
                  ? '⏱️ Temps de préparation'
                  : '📅 Détails de l\'événement'}
              </h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            {selectedEvent.type === 'BOOKING' && bookingDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Client</label>
                    <p className="text-white font-medium">{bookingDetails.client?.name}</p>
                    {bookingDetails.client?.email && (
                      <p className="text-sm text-gray-400">{bookingDetails.client.email}</p>
                    )}
                    {bookingDetails.client?.phone && (
                      <p className="text-sm text-gray-400">{bookingDetails.client.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Véhicule</label>
                    <p className="text-white font-medium">
                      {bookingDetails.vehicle?.brand} {bookingDetails.vehicle?.model}
                    </p>
                    <p className="text-sm text-gray-400">
                      {bookingDetails.vehicle?.registrationNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Date de début</label>
                    <p className="text-white">{new Date(bookingDetails.startDate).toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Date de fin</label>
                    <p className="text-white">{new Date(bookingDetails.endDate).toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Prix total</label>
                    <p className="text-white font-semibold text-lg">{bookingDetails.totalPrice}€</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Statut</label>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full inline-block ${
                        bookingDetails.status === 'IN_PROGRESS' || bookingDetails.status === 'LATE'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : bookingDetails.status === 'CONFIRMED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : bookingDetails.status === 'RETURNED'
                          ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {bookingDetails.status === 'IN_PROGRESS' || bookingDetails.status === 'LATE'
                        ? 'ACTIVE'
                        : bookingDetails.status === 'RETURNED'
                        ? 'TERMINÉE'
                        : bookingDetails.status === 'CONFIRMED'
                        ? 'Confirmée'
                        : bookingDetails.status === 'PENDING'
                        ? 'En attente'
                        : bookingDetails.status}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-600">
                  <button
                    onClick={() => {
                      window.location.href = '/bookings';
                    }}
                    className="px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] transition-colors"
                  >
                    Voir les détails complets
                  </button>
                </div>
              </div>
            )}

            {selectedEvent.type === 'PREPARATION_TIME' && (
              <div className="space-y-4">
                <div className="bg-[#1D1F23] p-4 rounded-lg">
                  <p className="text-white">{selectedEvent.description || 'Temps de préparation du véhicule'}</p>
                  {selectedEvent.isLate && (
                    <p className="text-yellow-400 text-sm mt-2">⚠️ Retard détecté - Temps de préparation prolongé</p>
                  )}
                </div>
              </div>
            )}

            {selectedEvent.type === 'MAINTENANCE' && maintenanceDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Véhicule</label>
                    <p className="text-white font-medium">
                      {maintenanceDetails.vehicle?.brand} {maintenanceDetails.vehicle?.model}
                    </p>
                    <p className="text-sm text-gray-400">
                      {maintenanceDetails.vehicle?.registrationNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Statut</label>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full inline-block ${
                        maintenanceDetails.status === 'IN_PROGRESS'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : maintenanceDetails.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {maintenanceDetails.status === 'IN_PROGRESS' ? 'En cours' :
                       maintenanceDetails.status === 'COMPLETED' ? 'Terminée' :
                       maintenanceDetails.status === 'PLANNED' ? 'Planifiée' :
                       maintenanceDetails.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-400">Description</label>
                    <p className="text-white bg-[#1D1F23] p-3 rounded-lg">{maintenanceDetails.description}</p>
                  </div>
                  {maintenanceDetails.plannedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Date prévue</label>
                      <p className="text-white">{new Date(maintenanceDetails.plannedAt).toLocaleString('fr-FR')}</p>
                    </div>
                  )}
                  {maintenanceDetails.cost && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Coût</label>
                      <p className="text-white font-semibold text-lg">{maintenanceDetails.cost}€</p>
                    </div>
                  )}
                  {maintenanceDetails.documentUrl && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-400">Facture / Devis</label>
                      <a
                        href={maintenanceDetails.documentUrl.startsWith('http') 
                          ? maintenanceDetails.documentUrl 
                          : `http://localhost:3000${maintenanceDetails.documentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3E7BFA] hover:text-[#2E6BEA] underline"
                      >
                        Voir le document
                      </a>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-600">
                  <button
                    onClick={() => {
                      window.location.href = '/maintenance';
                    }}
                    className="px-4 py-2 bg-[#3E7BFA] text-white rounded-lg hover:bg-[#2E6BEA] transition-colors"
                  >
                    Voir les détails complets
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}






