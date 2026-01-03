'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { planningApi, PlanningData } from '@/lib/api/planning';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/lib/api/booking';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';

interface PlanningCalendarProps {
  selectedAgencyId?: string | null;
}

export function PlanningCalendar({ selectedAgencyId }: PlanningCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState('resourceTimelineDay');
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: string; end: string; resourceId?: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: Date; vehicleId?: string } | null>(null);
  const [filters, setFilters] = useState<{ vehicleId?: string; status?: string }>({});

  const { data, isLoading, error } = useQuery<PlanningData>({
    queryKey: ['planning', selectedAgencyId, filters],
    queryFn: () => planningApi.getPlanning({ agencyId: selectedAgencyId || undefined }),
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', selectedAgencyId],
    queryFn: () => vehicleApi.getAll(selectedAgencyId || undefined),
    enabled: !!selectedAgencyId || showVehicleSelector,
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, startDate, endDate, vehicleId }: { id: string; startDate: string; endDate: string; vehicleId?: string }) => {
      const updateData: any = {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };
      if (vehicleId) {
        updateData.vehicleId = vehicleId;
      }
      return bookingApi.update(id, updateData);
    },
    onSuccess: () => {
      toast.success('Réservation mise à jour');
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const { start, end } = selectInfo;
    // Ouvrir le sélecteur de véhicule pour créer un booking
    setSelectedDateRange({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    setShowVehicleSelector(true);
    calendarRef.current?.getApi().unselect();
  };

  const handleContextMenu = (event: MouseEvent, date: Date, vehicleId?: string) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      date,
      vehicleId,
    });
  };

  // Ajouter le handler pour le clic droit sur le calendrier
  useEffect(() => {
    const calendarEl = (calendarRef.current as any)?.el;
    if (!calendarEl) return;

    const handleRightClick = (e: MouseEvent) => {
      // Vérifier si le clic est sur une zone de ressource (véhicule)
      const target = e.target as HTMLElement;
      const slotCell = target.closest('.fc-timegrid-slot, .fc-daygrid-day');
      
      if (slotCell) {
        e.preventDefault();
        
        // Essayer de récupérer la ressource (véhicule) depuis le DOM
        const resourceEl = target.closest('.fc-resource');
        const resourceId = resourceEl?.getAttribute('data-resource-id') || 
                          (resourceEl?.querySelector('.fc-resource-cell') as HTMLElement)?.dataset?.resourceId;
        
        // Récupérer la date depuis le slot
        const slotStart = (slotCell as any).fcSeg?.start || 
                         (slotCell as any).fcDay?.date ||
                         new Date();
        
        handleContextMenu(e, slotStart, resourceId || undefined);
      }
    };

    calendarEl.addEventListener('contextmenu', handleRightClick);

    return () => {
      calendarEl.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventType = clickInfo.event.extendedProps?.type;
    
    if (eventType === 'booking') {
      const bookingId = clickInfo.event.extendedProps?.bookingId || clickInfo.event.id?.replace('booking-', '');
      if (bookingId) {
        router.push(`/agency/bookings/${bookingId}`);
      }
    } else if (eventType === 'maintenance') {
      const maintenanceId = clickInfo.event.extendedProps?.maintenanceId || clickInfo.event.id?.replace('maintenance-', '');
      if (maintenanceId) {
        router.push(`/agency/maintenance/${maintenanceId}`);
      }
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event, newResource } = dropInfo;
    const bookingId = event.extendedProps?.bookingId || event.id?.replace('booking-', '');
    const start = event.start;
    const end = event.end;
    const newVehicleId = newResource?.id || event.getResources()[0]?.id;
    
    if (bookingId && start && end && newVehicleId) {
      // Vérifier la disponibilité avant de mettre à jour
      try {
        const availability = await planningApi.checkAvailability({
          vehicleId: newVehicleId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        
        if (!availability.available && availability.conflicts.length > 0) {
          // Annuler le déplacement et afficher un message
          queryClient.invalidateQueries({ queryKey: ['planning'] });
          toast.error(`Véhicule non disponible : ${availability.conflicts.map((c: { type: string }) => c.type).join(', ')}`);
          return;
        }
        
        // Mettre à jour le booking avec le nouveau véhicule si nécessaire
        const currentVehicleId = event.extendedProps?.vehicleId || event.getResources()[0]?.id;
        if (newVehicleId !== currentVehicleId) {
          // Si le véhicule a changé, mettre à jour aussi le véhicule
          updateBookingMutation.mutate({
            id: bookingId,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            vehicleId: newVehicleId,
          } as any);
        } else {
          // Sinon, juste mettre à jour les dates
          updateBookingMutation.mutate({
            id: bookingId,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          });
        }
      } catch (error: any) {
        // En cas d'erreur, annuler le déplacement
        queryClient.invalidateQueries({ queryKey: ['planning'] });
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
    }
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
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span className="text-xs text-text-muted">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-xs text-text-muted">Préparation</span>
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
                value={filters.vehicleId || ''}
                onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value || undefined })}
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
            <div className="flex-1 min-w-[200px] max-w-xs">
              <label htmlFor="status-filter" className="block text-sm font-medium text-text mb-1">
                Filtrer par statut
              </label>
              <select
                id="status-filter"
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
              >
                <option value="">Tous les statuts</option>
                <option value="DRAFT">Brouillon</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmé</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="RETURNED">Retourné</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
            {(filters.vehicleId || filters.status) && (
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-background"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Boutons de vue */}
        <div className="mb-4 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              calendarRef.current?.getApi().changeView('resourceTimelineDay');
              setCurrentView('resourceTimelineDay');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'resourceTimelineDay'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-card text-text hover:bg-background border border-border'
            }`}
          >
            Jour
          </button>
          <button
            onClick={() => {
              calendarRef.current?.getApi().changeView('resourceTimelineWeek');
              setCurrentView('resourceTimelineWeek');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'resourceTimelineWeek'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-card text-text hover:bg-background border border-border'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => {
              calendarRef.current?.getApi().changeView('dayGridMonth');
              setCurrentView('dayGridMonth');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'dayGridMonth'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-card text-text hover:bg-background border border-border'
            }`}
          >
            Mois
          </button>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            resourceTimelinePlugin,
            interactionPlugin,
          ]}
          initialView="resourceTimelineDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineDay,resourceTimelineWeek,dayGridMonth',
          }}
          resources={data?.resources || []}
          events={useMemo(() => {
            if (!data?.events) return [];
            
            // Créer un map des ressources pour éviter les recherches répétées
            const resourceMap = new Map(
              (data.resources || []).map((r) => [r.id, r])
            );
            
            return data.events
              .filter((event) => {
                // Appliquer les filtres
                if (filters.vehicleId && event.resourceId !== filters.vehicleId) return false;
                if (filters.status && event.extendedProps?.status !== filters.status) return false;
                return true;
              })
              .map((event) => {
                const resource = resourceMap.get(event.resourceId);
                return {
                  ...event,
                  title: event.title,
                  extendedProps: {
                    ...event.extendedProps,
                    vehicleInfo: resource
                      ? `${resource.extendedProps.brand} ${resource.extendedProps.model}`
                      : '',
                  },
                };
              });
          }, [data?.events, data?.resources, filters.vehicleId, filters.status])}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
          selectable={true}
          selectMirror={true}
          editable={true}
          droppable={true}
          eventResizableFromStart={true}
          nowIndicator={true}
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventMaxStack={3}
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={(dropInfo) => {
            // Seulement permettre le drag & drop des bookings, pas des maintenances
            if (dropInfo.event.extendedProps?.type === 'booking') {
              handleEventDrop(dropInfo);
            } else {
              // Annuler le déplacement pour les maintenances
              queryClient.invalidateQueries({ queryKey: ['planning'] });
            }
          }}
          eventResize={async (resizeInfo) => {
            const { event } = resizeInfo;
            const bookingId = event.extendedProps?.bookingId || event.id?.replace('booking-', '');
            const start = event.start;
            const end = event.end;
            const vehicleId = event.getResources()[0]?.id;
            
            if (bookingId && start && end && vehicleId) {
              // Vérifier la disponibilité avant de redimensionner
              try {
                const availability = await planningApi.checkAvailability({
                  vehicleId,
                  startDate: start.toISOString(),
                  endDate: end.toISOString(),
                });
                
                if (!availability.available && availability.conflicts.length > 0) {
                  // Annuler le redimensionnement
                  queryClient.invalidateQueries({ queryKey: ['planning'] });
                  toast.error(`Véhicule non disponible : ${availability.conflicts.map((c: { type: string }) => c.type).join(', ')}`);
                  return;
                }
                
                updateBookingMutation.mutate({
                  id: bookingId,
                  startDate: start.toISOString(),
                  endDate: end.toISOString(),
                });
              } catch (error: any) {
                queryClient.invalidateQueries({ queryKey: ['planning'] });
                toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
              }
            }
          }}
          eventContent={(eventInfo) => {
            const event = eventInfo.event;
            const resourceId = (event as any).resourceId || event.extendedProps?.resourceId;
            const resource = data?.resources?.find((r) => r.id === resourceId);
            const eventType = event.extendedProps?.type || '';
            const status = event.extendedProps?.status || '';
            
            // Déterminer l'icône selon le type
            const getEventIcon = () => {
              if (eventType === 'booking') {
                if (status === 'IN_PROGRESS') return '🚗';
                if (status === 'LATE') return '⚠️';
                return '📅';
              }
              if (eventType === 'maintenance') {
                if (status === 'IN_PROGRESS') return '🔧';
                return '⚙️';
              }
              if (eventType === 'PREPARATION_TIME') return '⏱️';
              return '📌';
            };
            
            return (
              <div className="p-2 h-full flex flex-col justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-sm">{getEventIcon()}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs leading-tight truncate">
                      {event.title}
                    </div>
                    {resource && (
                      <div className="text-xs opacity-80 mt-0.5 truncate">
                        {resource.extendedProps.brand} {resource.extendedProps.model}
                      </div>
                    )}
                  </div>
                </div>
                {resource?.extendedProps?.agencyName && (
                  <div className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{resource.extendedProps.agencyName}</span>
                  </div>
                )}
              </div>
            );
          }}
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
    </>
  );
}
