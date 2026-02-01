import { useMemo, useRef, useState } from 'react';
import api from '../lib/axios';

type PlanningResource = {
  id: string;
  title: string;
  extendedProps?: Record<string, any>;
};

type PlanningEvent = {
  id: string;
  resourceId: string;
  title: string;
  start: string;
  end: string;
  extendedProps?: Record<string, any>;
};

type PlanningBoardProps = {
  resources: PlanningResource[];
  events: PlanningEvent[];
  view: 'day' | 'week' | 'month';
  currentDate: Date;
  onChangeDate: (next: Date) => void;
  onEventUpdated: () => void;
  onEventClick?: (event: PlanningEvent) => void;
  onContextMenu?: (args: { date: Date; resourceId?: string; x: number; y: number }) => void;
};

const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 24;

const MINUTES_IN_DAY = (END_HOUR - START_HOUR) * 60;
const SLOT_COUNT = MINUTES_IN_DAY / SLOT_MINUTES;

const toStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeToKnownType = (value: unknown): 'BOOKING' | 'MAINTENANCE' | 'PREPARATION_TIME' | 'OTHER' => {
  const raw = typeof value === 'string' ? value : '';
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'BOOKING') return 'BOOKING';
  if (normalized === 'MAINTENANCE') return 'MAINTENANCE';
  if (normalized === 'PREPARATION_TIME') return 'PREPARATION_TIME';
  return 'OTHER';
};

const getEventType = (event: PlanningEvent) => normalizeToKnownType(event.extendedProps?.type);

const getEventClassName = (type: ReturnType<typeof getEventType>) => {
  if (type === 'MAINTENANCE') return 'event maintenance';
  if (type === 'PREPARATION_TIME') return 'event preparation';
  if (type === 'OTHER') return 'event other';
  return 'event booking';
};

const getBookingId = (event: PlanningEvent) =>
  event.extendedProps?.bookingId || event.id?.replace('booking-', '');

const getEventRangeForDay = (event: PlanningEvent, day: Date) => {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayStart = toStartOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  if (end <= dayStart || start >= dayEnd) {
    return null;
  }
  const effectiveStart = start < dayStart ? dayStart : start;
  const effectiveEnd = end > dayEnd ? dayEnd : end;
  return { start: effectiveStart, end: effectiveEnd };
};

export function PlanningBoard({
  resources,
  events,
  view,
  currentDate,
  onChangeDate: _onChangeDate,
  onEventUpdated,
  onEventClick,
  onContextMenu,
}: PlanningBoardProps) {
  const [dragState, setDragState] = useState<{
    eventId: string;
    mode: 'move' | 'resize-start' | 'resize-end';
    originY: number;
    originX: number;
    originalStart: Date;
    originalEnd: Date;
    resourceId: string;
  } | null>(null);
  const [draftEvents, setDraftEvents] = useState<Record<string, { start: Date; end: Date; resourceId: string }>>({});
  const boardRef = useRef<HTMLDivElement>(null);
  const lastTargetResourceIdRef = useRef<string | null>(null);
  const DRAG_OTHER_VEHICLE_MSG =
    'Vous pouvez uniquement modifier la date. Le changement de véhicule n\'est pas disponible dans cette version.';

  const day = useMemo(() => toStartOfDay(currentDate), [currentDate]);
  const weekStart = useMemo(() => {
    const start = toStartOfDay(currentDate);
    const dayIndex = (start.getDay() + 6) % 7;
    return addDays(start, -dayIndex);
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let i = 0; i <= SLOT_COUNT; i += 1) {
      const totalMinutes = START_HOUR * 60 + i * SLOT_MINUTES;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    return slots;
  }, []);

  const dayEvents = useMemo(() => {
    return events.filter((event) => {
      const range = getEventRangeForDay(event, day);
      return Boolean(range);
    });
  }, [events, day]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx));
  }, [weekStart]);

  const monthDays = useMemo(() => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const start = addDays(first, -(first.getDay() + 6) % 7);
    const days: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentDate]);

  const commitBookingUpdate = async (eventId: string) => {
    const draft = draftEvents[eventId];
    if (!draft) return;
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    if (getEventType(event) !== 'BOOKING') return;

    const bookingId = getBookingId(event);
    if (!bookingId) return;

    const availability = await api.post('/planning/check-availability', {
      vehicleId: draft.resourceId,
      startDate: draft.start.toISOString(),
      endDate: draft.end.toISOString(),
    });

    if (!availability.data.available && availability.data.conflicts?.length) {
      setDraftEvents((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
      return;
    }

    await api.patch(`/bookings/${bookingId}`, {
      startDate: draft.start.toISOString(),
      endDate: draft.end.toISOString(),
      vehicleId: draft.resourceId,
    });
    setDraftEvents((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    onEventUpdated();
  };

  const attachDragListeners = () => {
    const handleMove = (event: PointerEvent) => {
      if (!dragState || view !== 'day') return;
      const container = boardRef.current;
      if (!container) return;
      const columns = Array.from(container.querySelectorAll('[data-vehicle-column]')) as HTMLDivElement[];
      const column = columns.find((col) => {
        const rect = col.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right;
      });

      const targetResourceId = column?.dataset.vehicleColumn || dragState.resourceId;
      lastTargetResourceIdRef.current = targetResourceId;
      const sameVehicle = targetResourceId === dragState.resourceId;
      const effectiveResourceId = sameVehicle ? targetResourceId : dragState.resourceId;

      const deltaMinutes = Math.round((event.clientY - dragState.originY) / SLOT_HEIGHT) * SLOT_MINUTES;
      let nextStart = new Date(dragState.originalStart);
      let nextEnd = new Date(dragState.originalEnd);

      if (dragState.mode === 'move') {
        nextStart = new Date(dragState.originalStart.getTime() + deltaMinutes * 60000);
        nextEnd = new Date(dragState.originalEnd.getTime() + deltaMinutes * 60000);
      } else if (dragState.mode === 'resize-start') {
        nextStart = new Date(dragState.originalStart.getTime() + deltaMinutes * 60000);
      } else {
        nextEnd = new Date(dragState.originalEnd.getTime() + deltaMinutes * 60000);
      }

      const minStart = new Date(day);
      minStart.setHours(START_HOUR, 0, 0, 0);
      const maxEnd = new Date(day);
      maxEnd.setHours(END_HOUR, 0, 0, 0);

      nextStart = new Date(clamp(nextStart.getTime(), minStart.getTime(), maxEnd.getTime() - SLOT_MINUTES * 60000));
      nextEnd = new Date(clamp(nextEnd.getTime(), minStart.getTime() + SLOT_MINUTES * 60000, maxEnd.getTime()));

      if (nextEnd <= nextStart) {
        nextEnd = new Date(nextStart.getTime() + SLOT_MINUTES * 60000);
      }

      setDraftEvents((prev) => ({
        ...prev,
        [dragState.eventId]: {
          start: nextStart,
          end: nextEnd,
          resourceId: effectiveResourceId,
        },
      }));
    };

    const handleUp = () => {
      if (!dragState) return;
      const droppedOnOtherVehicle =
        lastTargetResourceIdRef.current != null && lastTargetResourceIdRef.current !== dragState.resourceId;
      lastTargetResourceIdRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);

      if (droppedOnOtherVehicle) {
        setDraftEvents((prev) => {
          const next = { ...prev };
          delete next[dragState.eventId];
          return next;
        });
        setDragState(null);
        window.alert(DRAG_OTHER_VEHICLE_MSG);
        return;
      }
      commitBookingUpdate(dragState.eventId).catch(() => {});
      setDragState(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    item: PlanningEvent,
    mode: 'move' | 'resize-start' | 'resize-end',
  ) => {
    if (getEventType(item) !== 'BOOKING') return;
    event.preventDefault();
    event.stopPropagation();
    const start = new Date(item.start);
    const end = new Date(item.end);
    setDragState({
      eventId: item.id,
      mode,
      originY: event.clientY,
      originX: event.clientX,
      originalStart: start,
      originalEnd: end,
      resourceId: item.resourceId,
    });
    attachDragListeners();
  };

  const renderDayView = () => {
    const columnHeight = SLOT_COUNT * SLOT_HEIGHT;
    return (
      <div className="planning-grid" ref={boardRef}>
        <div className="planning-header">
          <div className="time-col-header" />
          {resources.map((resource) => (
            <div key={resource.id} className="vehicle-col-header">
              {resource.title}
            </div>
          ))}
        </div>
        <div className="planning-body">
          <div className="time-column">
            {timeSlots.map((slot) => (
              <div key={slot} className="time-slot">
                {slot}
              </div>
            ))}
          </div>
          <div className="vehicles-columns">
            {resources.map((resource) => (
              <div
                key={resource.id}
                data-vehicle-column={resource.id}
                className="vehicle-column"
                style={{ height: columnHeight }}
                onContextMenu={(event) => {
                  if (!onContextMenu) return;
                  event.preventDefault();
                  const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const offsetY = event.clientY - rect.top;
                  const minutesFromStart = Math.round(offsetY / SLOT_HEIGHT) * SLOT_MINUTES;
                  const slotDate = new Date(day);
                  slotDate.setHours(START_HOUR, 0, 0, 0);
                  slotDate.setMinutes(slotDate.getMinutes() + minutesFromStart);
                  onContextMenu({
                    date: slotDate,
                    resourceId: resource.id,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                {dayEvents
                  .filter((event) => event.resourceId === resource.id)
                  .map((event) => {
                    const draft = draftEvents[event.id];
                    const start = draft?.start || new Date(event.start);
                    const end = draft?.end || new Date(event.end);
                    const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                    const endMinutes = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
                    const top = (startMinutes / SLOT_MINUTES) * SLOT_HEIGHT;
                    const height = Math.max(1, (endMinutes - startMinutes) / SLOT_MINUTES * SLOT_HEIGHT);
                    const type = getEventType(event);
                    const className = getEventClassName(type);

                    return (
                      <div
                        key={event.id}
                        className={className}
                        style={{ top, height }}
                        onPointerDown={(e) => handlePointerDown(e, event, 'move')}
                        onClick={() => onEventClick?.(event)}
                      >
                        {type === 'BOOKING' && (
                          <div
                            className="resize-handle top"
                            onPointerDown={(e) => handlePointerDown(e, event, 'resize-start')}
                          />
                        )}
                        <div className="event-title">{event.title}</div>
                        {type === 'BOOKING' && (
                          <div
                            className="resize-handle bottom"
                            onPointerDown={(e) => handlePointerDown(e, event, 'resize-end')}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="planning-week">
        <div className="planning-week-header">
          <div className="week-spacer" />
          {weekDays.map((dayItem) => (
            <div key={dayItem.toISOString()} className="week-day-header">
              {dayItem.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>
        <div className="planning-week-body">
          {resources.map((resource) => (
            <div key={resource.id} className="week-row">
              <div className="week-resource">{resource.title}</div>
              {weekDays.map((dayItem) => {
                const dayEventsForCell = events.filter((event) => {
                  if (event.resourceId !== resource.id) return false;
                  return Boolean(getEventRangeForDay(event, dayItem));
                });
                return (
                  <div key={dayItem.toISOString()} className="week-cell">
                    {dayEventsForCell.map((event) => {
                      const type = getEventType(event);
                      const className = getEventClassName(type);
                      return (
                        <div key={event.id} className={className}>
                          <div className="event-title" onClick={() => onEventClick?.(event)}>
                            {event.title}
                          </div>
                        </div>
                      );
                    })}
                    {onContextMenu && (
                      <div
                        className="week-cell-overlay"
                        onContextMenu={(event) => {
                          event.preventDefault();
                          onContextMenu({
                            date: new Date(dayItem),
                            resourceId: resource.id,
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="planning-month">
        <div className="month-grid">
          {monthDays.map((dayItem) => {
            const dayEventsForCell = events.filter((event) => getEventRangeForDay(event, dayItem));
            return (
              <div
                key={dayItem.toISOString()}
                className={`month-cell ${dayItem.getMonth() === currentDate.getMonth() ? '' : 'muted'}`}
              >
                <div className="month-date">{dayItem.getDate()}</div>
                {dayEventsForCell.map((event) => {
                  const type = getEventType(event);
                  const className = getEventClassName(type);
                  return (
                    <div key={event.id} className={className}>
                      <div className="event-title" onClick={() => onEventClick?.(event)}>
                        {event.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="planning-board">
      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </div>
  );
}
