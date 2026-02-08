'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await apiClient.get('/contracts');
      return res.data;
    },
  });

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

  const downloadPdf = async (contractId: string) => {
    try {
      const res = await apiClient.get(`/contracts/${contractId}/payload`);
      console.log('Contract payload:', res.data);
      alert('PDF du contrat - Fonctionnalité à implémenter');
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
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
                    <Button variant="outline" size="sm" onClick={() => downloadPdf(contract.id)}>
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
