'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface JournalEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  bookingNumber: string | null;
  vehicleId: string | null;
  isManualNote: boolean;
  createdAt: string;
  editedAt: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  BOOKING_CREATED: 'bg-blue-500',
  BOOKING_UPDATED: 'bg-blue-400',
  BOOKING_CANCELLED: 'bg-red-500',
  CHECK_IN: 'bg-green-500',
  CHECK_OUT: 'bg-green-600',
  INVOICE_ISSUED: 'bg-purple-500',
  CREDIT_NOTE_ISSUED: 'bg-orange-500',
  CONTRACT_CREATED: 'bg-indigo-500',
  CONTRACT_SIGNED: 'bg-indigo-600',
  INCIDENT_REPORTED: 'bg-red-400',
  INCIDENT_RESOLVED: 'bg-green-400',
  GPS_SNAPSHOT: 'bg-cyan-500',
  MANUAL_NOTE: 'bg-yellow-500',
  SYSTEM_EVENT: 'bg-gray-500',
};

export default function JournalPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const queryClient = useQueryClient();

  const { data: rawEntries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal', typeFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await apiClient.get(`/journal?${params.toString()}`);
      return res.data ?? [];
    },
  });
  const entries = rawEntries ?? [];

  // Get current user profile for agencyId
  const { data: currentUser } = useQuery<{ agencyIds?: string[] }>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const agencyId = currentUser?.agencyIds?.[0] || '';
      return apiClient.post('/journal/notes', {
        agencyId,
        title: data.title,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setNoteDialogOpen(false);
      setNoteTitle('');
      setNoteContent('');
    },
  });

  const filteredEntries = entries.filter((entry) => {
    const haystack = [entry.title, entry.content, entry.bookingNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <div className="text-center py-8">Chargement...</div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Journal d&apos;agence</h1>
        <Button onClick={() => setNoteDialogOpen(true)}>Ajouter une note</Button>
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Titre"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <Textarea
                placeholder="Contenu de la note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
              <Button
                onClick={() =>
                  createNoteMutation.mutate({ title: noteTitle, content: noteContent })
                }
                disabled={!noteTitle || !noteContent || createNoteMutation.isPending}
              >
                {createNoteMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          <option value="">Tous les types</option>
          <option value="BOOKING_CREATED">Réservation créée</option>
          <option value="CHECK_IN">Check-in</option>
          <option value="CHECK_OUT">Check-out</option>
          <option value="INVOICE_ISSUED">Facture émise</option>
          <option value="CONTRACT_SIGNED">Contrat signé</option>
          <option value="INCIDENT_REPORTED">Incident signalé</option>
          <option value="MANUAL_NOTE">Note manuelle</option>
        </select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Contenu</TableHead>
              <TableHead>N° Réservation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucune entrée trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                    {entry.editedAt && (
                      <span className="text-xs text-muted-foreground block">(modifié)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={TYPE_COLORS[entry.type] || 'bg-gray-500'}>
                      {entry.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{entry.title}</TableCell>
                  <TableCell className="max-w-md truncate">{entry.content}</TableCell>
                  <TableCell className="font-mono">{entry.bookingNumber || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
