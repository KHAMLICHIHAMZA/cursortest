'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'INVOICE' | 'CREDIT_NOTE';
  status: 'ISSUED' | 'PAID' | 'CANCELLED';
  totalAmount: number;
  issuedAt: string;
  booking?: {
    bookingNumber: string;
    client?: { name: string };
    vehicle?: { brand: string; model: string; registrationNumber: string };
  };
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('');

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await apiClient.get('/invoices');
      return res.data;
    },
  });

  const filteredInvoices = invoices.filter((inv) => {
    const haystack = [
      inv.invoiceNumber,
      inv.booking?.bookingNumber,
      inv.booking?.client?.name,
      inv.booking?.vehicle?.registrationNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const getStatusKey = (status: string): 'confirmed' | 'success' | 'error' | 'cancelled' => {
    switch (status) {
      case 'ISSUED': return 'confirmed';
      case 'PAID': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'cancelled';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ISSUED': return 'Émise';
      case 'PAID': return 'Payée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await apiClient.get(`/invoices/${invoiceId}/payload`);
      console.log('Invoice payload:', res.data);
      alert(`PDF de la facture ${invoiceNumber} - Fonctionnalité à implémenter`);
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
        <h1 className="text-2xl font-bold">Factures</h1>
      </div>

      <div>
        <Input
          placeholder="Rechercher par numéro, client, véhicule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>N° Réservation</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucune facture trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <Badge status={invoice.type === 'CREDIT_NOTE' ? 'pending' : 'confirmed'}>
                      {invoice.type === 'CREDIT_NOTE' ? 'Avoir' : 'Facture'}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.booking?.bookingNumber || '-'}</TableCell>
                  <TableCell>{invoice.booking?.client?.name || '-'}</TableCell>
                  <TableCell>
                    {invoice.booking?.vehicle
                      ? `${invoice.booking.vehicle.brand} ${invoice.booking.vehicle.model}`
                      : '-'}
                  </TableCell>
                  <TableCell className={invoice.totalAmount < 0 ? 'text-red-600' : ''}>
                    {formatAmount(invoice.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge status={getStatusKey(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadPdf(invoice.id, invoice.invoiceNumber)}
                    >
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
