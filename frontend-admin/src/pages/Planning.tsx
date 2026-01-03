import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import resourceTimeline from '@fullcalendar/resource-timeline';
import api from '../lib/axios';

export default function Planning() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [selectedAgency, setSelectedAgency] = useState<string>('');

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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Planning Global</h1>
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
              <div className="text-xs">
                {arg.resource.title}
              </div>
            )}
            eventContent={(arg) => (
              <div className="text-xs p-1">
                {arg.event.title}
              </div>
            )}
            datesSet={(arg) => {
              setStart(arg.start);
              setEnd(arg.end);
            }}
            themeSystem="standard"
          />
        )}
      </div>
    </div>
  );
}






