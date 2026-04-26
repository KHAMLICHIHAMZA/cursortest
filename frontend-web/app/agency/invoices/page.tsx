'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageFilters } from '@/components/ui/page-filters';
import { LoadingState } from '@/components/ui/loading-state';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { formatDateTimeFr } from '@/lib/utils/list-dates';
import { TableRowLink } from '@/components/ui/table-row-link';

interface Invoice {
  id: string;
  bookingId: string;
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
          <LoadingState message="Chargement des factures..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (isError) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
        <MainLayout>
          <div className="text-center py-8 text-error">Erreur lors du chargement des factures</div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <div className="max-w-7xl mx-auto pt-2 space-y-6">
          <PageHeader
            title="Factures"
            description="Consulter les factures et avoirs, puis exporter en PDF"
          />

          <PageFilters
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher par numéro, client, véhicule..."
            showReset={!!search}
            onReset={() => setSearch('')}
          />

          <Card className="p-0 overflow-hidden">
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
                    <TableCell colSpan={9} className="text-center py-8 text-text-muted">
                      Aucune facture trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const bookingHref = invoice.bookingId
                      ? `/agency/bookings/${invoice.bookingId}`
                      : null;
                    const cells = (
                      <>
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
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTimeFr(invoice.issuedAt)}
                        </TableCell>
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="text-right"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadPdf(invoice.id, invoice.invoiceNumber)}
                            disabled={downloadingId === invoice.id}
                          >
                            {downloadingId === invoice.id ? 'Chargement...' : 'PDF'}
                          </Button>
                        </TableCell>
                      </>
                    );
                    if (bookingHref) {
                      return (
                        <TableRowLink key={invoice.id} href={bookingHref} aria-label="Ouvrir la location liée">
                          {cells}
                        </TableRowLink>
                      );
                    }
                    return <TableRow key={invoice.id}>{cells}</TableRow>;
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
