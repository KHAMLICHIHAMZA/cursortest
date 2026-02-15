'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BarChart3, TrendingUp, TrendingDown, Car, DollarSign, Calendar, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface KpiResult {
  period: string;
  revenue: number;
  charges: number;
  margin: number;
  marginRate: number;
  occupancyRate: number;
  totalBookings: number;
  avgBookingValue: number;
  vehicleCount: number;
  chargesByCategory: Record<string, number>;
}

interface VehicleProfit {
  vehicleId: string;
  vehicle: string;
  revenue: number;
  charges: number;
  profit: number;
  bookingCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  BANK_INSTALLMENT: 'Mensualite bancaire',
  INSURANCE: 'Assurance',
  VIGNETTE: 'Vignette / Dariba',
  FUEL: 'Carburant',
  PREVENTIVE_MAINTENANCE: 'Maintenance preventive',
  CORRECTIVE_MAINTENANCE: 'Reparation / Maintenance corrective',
  EXCEPTIONAL: 'Charge exceptionnelle',
  OTHER: 'Autre',
};

export default function AgencyKpiPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(now.toISOString().slice(0, 10));

  const { data: kpi, isLoading: kpiLoading } = useQuery<KpiResult>({
    queryKey: ['kpi', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/charges/kpi', { params: { startDate, endDate } });
      return res.data;
    },
  });

  const { data: rawVehicleProfits } = useQuery<VehicleProfit[]>({
    queryKey: ['kpi-vehicles', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/charges/kpi/vehicles', { params: { startDate, endDate } });
      return res.data ?? [];
    },
  });
  const vehicleProfits = rawVehicleProfits ?? [];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            KPI &amp; Performance
          </h1>
          <p className="text-text-muted mt-1">Indicateurs cles de performance</p>
        </div>
        <div className="flex gap-3 items-center">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
          <span className="text-text-muted">a</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* KPI Cards */}
      {kpiLoading ? (
        <p className="text-text-muted text-center py-8">Chargement...</p>
      ) : kpi ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/15 rounded-lg"><DollarSign className="w-5 h-5 text-green-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Chiffre d&apos;affaires</p>
                  <p className="text-xl font-bold text-text">{kpi.revenue.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/15 rounded-lg"><TrendingDown className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Charges totales</p>
                  <p className="text-xl font-bold text-text">{kpi.charges.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.margin >= 0 ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                  <TrendingUp className={`w-5 h-5 ${kpi.margin >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Marge ({kpi.marginRate}%)</p>
                  <p className="text-xl font-bold text-text">{kpi.margin.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/15 rounded-lg"><Percent className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Taux d&apos;occupation</p>
                  <p className="text-xl font-bold text-text">{kpi.occupancyRate}%</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-text-muted text-sm">Reservations</p>
                  <p className="text-lg font-bold text-text">{kpi.totalBookings}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-text-muted text-sm">Panier moyen</p>
                  <p className="text-lg font-bold text-text">{kpi.avgBookingValue.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-text-muted text-sm">Vehicules</p>
                  <p className="text-lg font-bold text-text">{kpi.vehicleCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charges by category */}
          {Object.keys(kpi.chargesByCategory).length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text mb-4">Charges par categorie</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(kpi.chargesByCategory).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center bg-background rounded-lg p-3">
                    <span className="text-text-muted text-sm">{CATEGORY_LABELS[cat] || cat}</span>
                    <span className="font-semibold text-text">{Number(amount).toLocaleString('fr-FR')} MAD</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}

      {/* Vehicle profitability */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-text mb-4">Rentabilite par vehicule</h2>
        {vehicleProfits.length === 0 ? (
          <p className="text-text-muted text-center py-4">Aucune donnee</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicule</TableHead>
                <TableHead className="text-right">CA</TableHead>
                <TableHead className="text-right">Charges</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Locations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleProfits.map((v) => (
                <TableRow key={v.vehicleId}>
                  <TableCell className="font-medium">{v.vehicle}</TableCell>
                  <TableCell className="text-right">{v.revenue.toLocaleString('fr-FR')} MAD</TableCell>
                  <TableCell className="text-right">{v.charges.toLocaleString('fr-FR')} MAD</TableCell>
                  <TableCell className="text-right">
                    <Badge status={v.profit >= 0 ? 'success' : 'error'}>
                      {v.profit.toLocaleString('fr-FR')} MAD
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{v.bookingCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
