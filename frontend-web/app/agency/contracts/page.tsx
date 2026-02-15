'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

interface Contract {
  id: string;
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  version: number;
  clientSignedAt: string | null;
  agentSignedAt: string | null;
  effectiveAt: string | null;
  createdAt: string;
  booking?: {
    bookingNumber: string;
    client?: { name: string };
    vehicle?: { brand: string; model: string; registrationNumber: string };
  };
}

export default function ContractsPage() {
  const [search, setSearch] = useState('');

  const { data: rawContracts, isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await apiClient.get('/contracts');
      return res.data ?? [];
    },
  });
  const contracts = rawContracts ?? [];

  const filteredContracts = contracts.filter((contract) => {
    const haystack = [
      contract.booking?.bookingNumber,
      contract.booking?.client?.name,
      contract.booking?.vehicle?.registrationNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const getStatusKey = (status: string): 'draft' | 'pending' | 'success' | 'error' | 'cancelled' => {
    switch (status) {
      case 'DRAFT': return 'draft';
      case 'PENDING_SIGNATURE': return 'pending';
      case 'SIGNED': return 'success';
      case 'EXPIRED': return 'pending';
      case 'CANCELLED': return 'cancelled';
      default: return 'draft';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'PENDING_SIGNATURE': return 'En attente';
      case 'SIGNED': return 'Signé';
      case 'EXPIRED': return 'Expiré';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSignatureStatus = (contract: Contract) => {
    const client = contract.clientSignedAt ? '✓ Client' : '○ Client';
    const agent = contract.agentSignedAt ? '✓ Agent' : '○ Agent';
    return `${client} | ${agent}`;
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadPdf = async (contractId: string) => {
    setDownloadingId(contractId);
    try {
      const res = await apiClient.get(`/contracts/${contractId}/pdf`, {
        responseType: 'blob',
        // Prevent interceptor from misinterpreting blob error responses
        validateStatus: (status) => status < 500,
      });

      if (res.status !== 200) {
        // Try to read error message from blob
        let errorMsg = 'Erreur lors du téléchargement';
        try {
          const text = await res.data.text();
          const json = JSON.parse(text);
          errorMsg = json.message || errorMsg;
        } catch { /* ignore parse errors */ }
        toast.error(errorMsg);
        return;
      }

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat-${contractId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé avec succès');
    } catch (error: any) {
      console.error('Erreur téléchargement PDF:', error);
      const msg = error?.message || error?.response?.data?.message || 'Erreur lors du téléchargement du PDF';
      toast.error(typeof msg === 'string' ? msg : 'Erreur lors du téléchargement du PDF');
    } finally {
      setDownloadingId(null);
    }
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
        <h1 className="text-2xl font-bold">Contrats</h1>
      </div>

      <div>
        <Input
          placeholder="Rechercher par réservation, client, véhicule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Réservation</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Signatures</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Effectif</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun contrat trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono">
                    {contract.booking?.bookingNumber || '-'}
                  </TableCell>
                  <TableCell>{contract.booking?.client?.name || '-'}</TableCell>
                  <TableCell>
                    {contract.booking?.vehicle
                      ? `${contract.booking.vehicle.brand} ${contract.booking.vehicle.model}`
                      : '-'}
                  </TableCell>
                  <TableCell>v{contract.version}</TableCell>
                  <TableCell className="text-sm">{getSignatureStatus(contract)}</TableCell>
                  <TableCell>
                    <Badge status={getStatusKey(contract.status)}>
                      {getStatusLabel(contract.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(contract.effectiveAt)}</TableCell>
                  <TableCell>{formatDate(contract.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPdf(contract.id)}
                      disabled={downloadingId === contract.id}
                    >
                      {downloadingId === contract.id ? 'Chargement...' : 'PDF'}
                    </Button>
                  </TableCell>
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
