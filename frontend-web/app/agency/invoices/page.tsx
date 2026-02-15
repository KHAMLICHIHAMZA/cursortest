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

  const { data: rawInvoices, isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await apiClient.get('/invoices');
      return res.data ?? [];
    },
  });
  const invoices = rawInvoices ?? [];

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

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const res = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
        validateStatus: (status) => status < 500,
      });

      if (res.status !== 200) {
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
      link.download = `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Facture PDF téléchargée');
    } catch (error: any) {
      console.error('Erreur téléchargement PDF facture:', error);
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

  if (isError) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <div className="text-center py-8 text-red-500">Erreur lors du chargement des factures</div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
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
                      disabled={downloadingId === invoice.id}
                    >
                      {downloadingId === invoice.id ? 'Chargement...' : 'PDF'}
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
