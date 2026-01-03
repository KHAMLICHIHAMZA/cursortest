import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import resourceTimeline from '@fullcalendar/resource-timeline';
import api from '../lib/axios';
import { X } from 'lucide-react';

export default function Planning() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

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

  const handleEventClick = (info: any) => {
    const event = info.event;
    const extendedProps = event.extendedProps;
    
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
        <div className="flex gap-4">
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="px-4 py-2 bg-[#2C2F36] border border-gray-600 rounded-lg text-white"
          >
            <option value="">Toutes les agences</option>
            {agencies?.map((agency: any) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#2C2F36] rounded-lg border border-gray-700 p-4">
        {isLoading ? (
          <div className="text-center py-8">Chargement du planning...</div>
        ) : (
          <div className="planning-container">
            <FullCalendar
              plugins={[resourceTimeline]}
              initialView="resourceTimelineMonth"
              resources={planningData?.resources || []}
              events={planningData?.events || []}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
              }}
              height="auto"
              slotMinWidth={100}
              resourceAreaWidth="20%"
              resourceLabelContent={(arg) => (
                <div className="text-xs font-medium text-white">
                  {arg.resource.title}
                </div>
              )}
              eventContent={(arg) => {
                const eventType = arg.event.extendedProps?.type;
                const bgColor = eventType === 'BOOKING' 
                  ? '#3E7BFA' 
                  : eventType === 'MAINTENANCE'
                  ? '#EF4444'
                  : eventType === 'PREPARATION_TIME'
                  ? arg.event.extendedProps?.isLate ? '#F59E0B' : '#10B981'
                  : '#6B7280';
                
                return (
                  <div 
                    className="text-xs p-2 cursor-pointer hover:opacity-90 transition-all font-medium rounded shadow-sm"
                    style={{ 
                      backgroundColor: bgColor,
                      color: 'white',
                      border: `1px solid ${bgColor}`,
                    }}
                  >
                    {arg.event.title}
                  </div>
                );
              }}
              eventClick={handleEventClick}
              datesSet={(arg) => {
                setStart(arg.start);
                setEnd(arg.end);
              }}
              eventClassNames="cursor-pointer"
              eventMouseEnter={(info) => {
                info.el.style.cursor = 'pointer';
                info.el.style.opacity = '0.9';
              }}
              eventMouseLeave={(info) => {
                info.el.style.opacity = '1';
              }}
              themeSystem="standard"
            />
          </div>
        )}
      </div>

      <style>{`
        .planning-container .fc {
          color: #E5E7EB;
        }
        .planning-container .fc-theme-standard td,
        .planning-container .fc-theme-standard th {
          border-color: #374151;
        }
        .planning-container .fc-theme-standard .fc-scrollgrid {
          border-color: #374151;
        }
        .planning-container .fc-button {
          background-color: #3E7BFA;
          border-color: #3E7BFA;
          color: white;
        }
        .planning-container .fc-button:hover {
          background-color: #2E6BEA;
          border-color: #2E6BEA;
        }
        .planning-container .fc-button-active {
          background-color: #1E5BDA;
          border-color: #1E5BDA;
        }
        .planning-container .fc-toolbar-title {
          color: white;
          font-weight: 600;
        }
        .planning-container .fc-col-header-cell {
          background-color: #1D1F23;
          color: #9CA3AF;
        }
        .planning-container .fc-resource {
          background-color: #1D1F23;
        }
        .planning-container .fc-daygrid-day {
          background-color: #2C2F36;
        }
        .planning-container .fc-event {
          border-radius: 6px;
          padding: 0;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .planning-container .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .planning-container .fc-timeline-event {
          cursor: pointer;
        }
        .planning-container .fc-timeline-event:hover {
          opacity: 0.9;
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
                        bookingDetails.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : bookingDetails.status === 'CONFIRMED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {bookingDetails.status === 'IN_PROGRESS' ? 'En cours' :
                       bookingDetails.status === 'CONFIRMED' ? 'Confirmée' :
                       bookingDetails.status === 'PENDING' ? 'En attente' :
                       bookingDetails.status}
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






