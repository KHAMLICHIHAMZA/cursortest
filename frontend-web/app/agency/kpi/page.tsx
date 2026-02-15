'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BarChart3, TrendingUp, TrendingDown, Car, DollarSign, Calendar, Percent, Landmark, ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';
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
  totalPurchaseValue: number;
  periodAmortization: number;
  trueMargin: number;
  trueMarginRate: number;
  monthlyInstallments: number;
  financing: {
    cashVehicles: number;
    creditVehicles: number;
    mixedVehicles: number;
    totalDownPayments: number;
    expectedMonthlyTotal: number;
    actualMonthlyCharges: number;
    coherenceGap: number;
  };
}

interface VehicleProfit {
  vehicleId: string;
  vehicle: string;
  revenue: number;
  charges: number;
  profit: number;
  purchasePrice: number | null;
  amortization: number;
  trueProfit: number;
  financingType: string | null;
  monthlyPayment: number | null;
  installmentCharges: number;
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

/** Format a date to YYYY-MM-DD in the local timezone (avoids UTC shift at midnight) */
function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AgencyKpiPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toDateInputValue(now));

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

          {/* Amortissement & Marge réelle */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/15 rounded-lg"><Landmark className="w-5 h-5 text-purple-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Valeur parc (achat)</p>
                  <p className="text-xl font-bold text-text">{kpi.totalPurchaseValue.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/15 rounded-lg"><TrendingDown className="w-5 h-5 text-orange-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Amortissement (periode)</p>
                  <p className="text-xl font-bold text-text">{kpi.periodAmortization.toLocaleString('fr-FR')} MAD</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.trueMargin >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                  <ShieldCheck className={`w-5 h-5 ${kpi.trueMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Marge reelle ({kpi.trueMarginRate}%)</p>
                  <p className="text-xl font-bold text-text">{kpi.trueMargin.toLocaleString('fr-FR')} MAD</p>
                  <p className="text-xs text-text-muted">CA - Charges - Amortissement</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/15 rounded-lg"><DollarSign className="w-5 h-5 text-amber-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Mensualites bancaires</p>
                  <p className="text-xl font-bold text-text">{kpi.monthlyInstallments.toLocaleString('fr-FR')} MAD</p>
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
          {/* Financement du parc */}
          {kpi.financing && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Financement du parc
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">{kpi.financing.cashVehicles}</p>
                  <p className="text-text-muted text-sm">Comptant</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-500">{kpi.financing.creditVehicles}</p>
                  <p className="text-text-muted text-sm">Credit total</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-500">{kpi.financing.mixedVehicles}</p>
                  <p className="text-text-muted text-sm">Mixte (apport + credit)</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-500">{kpi.financing.totalDownPayments.toLocaleString('fr-FR')}</p>
                  <p className="text-text-muted text-sm">Total apports (MAD)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-background rounded-lg p-3 flex justify-between items-center">
                  <span className="text-text-muted text-sm">Mensualites attendues</span>
                  <span className="font-semibold text-text">{kpi.financing.expectedMonthlyTotal.toLocaleString('fr-FR')} MAD/mois</span>
                </div>
                <div className="bg-background rounded-lg p-3 flex justify-between items-center">
                  <span className="text-text-muted text-sm">Charges enregistrees</span>
                  <span className="font-semibold text-text">{kpi.financing.actualMonthlyCharges.toLocaleString('fr-FR')} MAD</span>
                </div>
                <div className={`rounded-lg p-3 flex justify-between items-center ${
                  Math.abs(kpi.financing.coherenceGap) > 1
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-green-500/10 border border-green-500/30'
                }`}>
                  <span className="text-text-muted text-sm flex items-center gap-1">
                    {Math.abs(kpi.financing.coherenceGap) > 1 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    Ecart coherence
                  </span>
                  <span className={`font-semibold ${
                    Math.abs(kpi.financing.coherenceGap) > 1 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {kpi.financing.coherenceGap > 0 ? '+' : ''}{kpi.financing.coherenceGap.toLocaleString('fr-FR')} MAD
                  </span>
                </div>
              </div>

              {Math.abs(kpi.financing.coherenceGap) > 1 && (
                <p className="text-xs text-red-400 mt-2">
                  Un ecart existe entre les mensualites attendues et les charges &quot;Mensualite bancaire&quot; enregistrees. Verifiez que toutes les mensualites sont bien saisies dans les charges.
                </p>
              )}
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
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicule</TableHead>
                <TableHead className="text-right">CA</TableHead>
                <TableHead className="text-right">Charges</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Prix achat</TableHead>
                <TableHead className="text-right">Amortis.</TableHead>
                <TableHead className="text-center">Financement</TableHead>
                <TableHead className="text-right">Mensualite</TableHead>
                <TableHead className="text-right">Profit reel</TableHead>
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
                  <TableCell className="text-right text-text-muted">
                    {v.purchasePrice != null ? `${v.purchasePrice.toLocaleString('fr-FR')} MAD` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-text-muted">
                    {v.amortization > 0 ? `${v.amortization.toLocaleString('fr-FR')} MAD` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {v.financingType === 'CASH' && <Badge status="success">Comptant</Badge>}
                    {v.financingType === 'CREDIT' && <Badge status="info">Credit</Badge>}
                    {v.financingType === 'MIXED' && <Badge status="warning">Mixte</Badge>}
                    {!v.financingType && <span className="text-text-muted">-</span>}
                  </TableCell>
                  <TableCell className="text-right text-text-muted">
                    {v.monthlyPayment != null ? `${v.monthlyPayment.toLocaleString('fr-FR')} MAD` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge status={v.trueProfit >= 0 ? 'success' : 'error'}>
                      {v.trueProfit.toLocaleString('fr-FR')} MAD
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{v.bookingCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </Card>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
