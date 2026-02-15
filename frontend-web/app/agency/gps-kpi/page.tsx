'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { MapPin, AlertTriangle, Activity, Gauge } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface GpsKpiResult {
  totalSnapshots: number;
  snapshotsByReason: Record<string, number>;
  gpsMissingCount: number;
  gpsMissingRate: number;
  avgAccuracy: number | null;
  distanceEstimates: {
    vehicleId: string;
    vehicle: string;
    snapshotCount: number;
    estimatedKm: number | null;
    checkInMileage: number | null;
    checkOutMileage: number | null;
    mileageDelta: number | null;
  }[];
  consistencyIssues: {
    bookingId: string;
    vehicleId: string;
    issue: string;
    details: string;
  }[];
}

const REASON_LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  INCIDENT: 'Incident',
  MANUAL: 'Manuel',
};

export default function GpsKpiPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(now.toISOString().slice(0, 10));

  const { data: kpi, isLoading } = useQuery<GpsKpiResult>({
    queryKey: ['gps-kpi', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/gps/kpi/eco', { params: { startDate, endDate } });
      return res.data;
    },
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            GPS Eco-KPI
          </h1>
          <p className="text-text-muted mt-1">Indicateurs GPS et coherence kilometrique</p>
        </div>
        <div className="flex gap-3 items-center">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
          <span className="text-text-muted">a</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {isLoading ? (
        <p className="text-text-muted text-center py-8">Chargement...</p>
      ) : kpi ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/15 rounded-lg"><MapPin className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Snapshots total</p>
                  <p className="text-xl font-bold text-text">{kpi.totalSnapshots}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/15 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">GPS manquant</p>
                  <p className="text-xl font-bold text-text">{kpi.gpsMissingCount} ({kpi.gpsMissingRate}%)</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/15 rounded-lg"><Gauge className="w-5 h-5 text-green-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Precision moyenne</p>
                  <p className="text-xl font-bold text-text">{kpi.avgAccuracy ? `${kpi.avgAccuracy}m` : 'N/A'}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/15 rounded-lg"><Activity className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="text-text-muted text-sm">Anomalies</p>
                  <p className="text-xl font-bold text-text">{kpi.consistencyIssues?.length ?? 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Snapshots by reason */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-text mb-4">Snapshots par type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(kpi.snapshotsByReason).map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center bg-background rounded-lg p-3">
                  <span className="text-text-muted text-sm">{REASON_LABELS[reason] || reason}</span>
                  <Badge status="active">{String(count)}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Distance estimates */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-text mb-4">Distance par vehicule</h2>
            {(kpi.distanceEstimates?.length ?? 0) === 0 ? (
              <p className="text-text-muted text-center py-4">Aucune donnee</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicule</TableHead>
                    <TableHead className="text-right">Snapshots</TableHead>
                    <TableHead className="text-right">Km check-in</TableHead>
                    <TableHead className="text-right">Km check-out</TableHead>
                    <TableHead className="text-right">Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(kpi.distanceEstimates ?? []).map((v) => (
                    <TableRow key={v.vehicleId}>
                      <TableCell className="font-medium">{v.vehicle}</TableCell>
                      <TableCell className="text-right">{v.snapshotCount}</TableCell>
                      <TableCell className="text-right">{v.checkInMileage?.toLocaleString('fr-FR') || '-'}</TableCell>
                      <TableCell className="text-right">{v.checkOutMileage?.toLocaleString('fr-FR') || '-'}</TableCell>
                      <TableCell className="text-right">
                        {v.mileageDelta != null ? (
                          <Badge status={v.mileageDelta >= 0 ? 'success' : 'error'}>
                            {v.mileageDelta.toLocaleString('fr-FR')} km
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Consistency issues */}
          {(kpi.consistencyIssues?.length ?? 0) > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Anomalies detectees
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicule</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(kpi.consistencyIssues ?? []).map((issue, i) => (
                    <TableRow key={i}>
                      <TableCell>{issue.vehicleId.slice(0, 8)}</TableCell>
                      <TableCell>
                        <Badge status="error">{issue.issue}</Badge>
                      </TableCell>
                      <TableCell className="text-text-muted">{issue.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      ) : null}
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
