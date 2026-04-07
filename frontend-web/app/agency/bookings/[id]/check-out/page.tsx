'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SimpleSignaturePad } from '@/components/ui/simple-signature-pad';
import { bookingApi, BookingFuelLevel, type TerrainDamagePayload } from '@/lib/api/booking';
import { TerrainDamagesEditor } from '@/components/booking/terrain-damages-editor';
import { uploadApi } from '@/lib/api/upload';
import { toast } from '@/components/ui/toast';

const FUEL_OPTIONS: { value: BookingFuelLevel; label: string }[] = [
  { value: 'EMPTY', label: 'Vide' },
  { value: 'QUARTER', label: '1/4' },
  { value: 'HALF', label: '1/2' },
  { value: 'THREE_QUARTERS', label: '3/4' },
  { value: 'FULL', label: 'Plein' },
];

function padPhotoSlots(urls: string[]): string[] {
  const next = [...urls];
  while (next.length < 4) next.push('');
  return next.slice(0, 4);
}

export default function BookingCheckOutPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [odometerEnd, setOdometerEnd] = useState('');
  const [fuelLevelEnd, setFuelLevelEnd] = useState<BookingFuelLevel>('FULL');
  const [photosAfter, setPhotosAfter] = useState<string[]>(['', '', '', '']);
  const [photosUploading, setPhotosUploading] = useState<Record<number, boolean>>({});
  const [notesEnd, setNotesEnd] = useState('');
  const [extraFees, setExtraFees] = useState('');
  const [damageFee, setDamageFee] = useState('');
  const [cashCollected, setCashCollected] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [newDamages, setNewDamages] = useState<TerrainDamagePayload[]>([]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getOne(bookingId),
    enabled: !!bookingId,
  });

  const checkOutMutation = useMutation({
    mutationFn: () => {
      const odo = Number(odometerEnd);
      if (Number.isNaN(odo) || odo < 0) {
        throw new Error('Kilométrage retour invalide');
      }
      const filled = photosAfter.filter(Boolean);
      if (filled.length < 4) {
        throw new Error('Quatre photos véhicule au retour sont requises');
      }
      if (!signature) {
        throw new Error('Signature retour requise');
      }
      if (cashCollected) {
        const amt = Number(cashAmount);
        if (Number.isNaN(amt) || amt <= 0) {
          throw new Error('Montant espèces requis si encaissement coché');
        }
      }
      const extra = extraFees.trim() ? Number(extraFees) : undefined;
      const damage = damageFee.trim() ? Number(damageFee) : undefined;
      if (extraFees.trim() && Number.isNaN(extra!)) throw new Error('Frais supplémentaires invalides');
      if (damageFee.trim() && Number.isNaN(damage!)) throw new Error('Frais dégâts invalides');
      for (const d of newDamages) {
        if (d.photos.length < 1) {
          throw new Error('Chaque dommage déclaré doit avoir au moins une photo');
        }
      }
      const newDamagesPayload =
        newDamages.length > 0
          ? newDamages.map((d) => ({
              zone: d.zone,
              type: d.type,
              severity: d.severity,
              description: d.description?.trim() || undefined,
              photos: d.photos,
            }))
          : undefined;

      return bookingApi.checkOut(bookingId, {
        odometerEnd: odo,
        fuelLevelEnd,
        photosAfter: filled,
        notesEnd: notesEnd.trim() || undefined,
        newDamages: newDamagesPayload,
        extraFees: extra,
        damageFee: damage,
        cashCollected: cashCollected || undefined,
        cashAmount:
          cashCollected && cashAmount.trim() ? Number(cashAmount) : undefined,
        returnSignature: signature,
      });
    },
    onSuccess: async () => {
      toast.success('Check-out enregistré');
      await queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      router.push(`/agency/bookings/${bookingId}`);
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = ax?.response?.data?.message || (err instanceof Error ? err.message : undefined);
      toast.error(msg || 'Erreur check-out');
    },
  });

  const handleUploadAt = async (index: number, file: File | null) => {
    if (!file) return;
    setPhotosUploading((s) => ({ ...s, [index]: true }));
    try {
      const { url } = await uploadApi.uploadFile(file);
      setPhotosAfter((prev) => {
        const next = padPhotoSlots(prev);
        next[index] = url;
        return next;
      });
      toast.success(`Photo ${index + 1} téléchargée`);
    } catch {
      toast.error('Échec du téléchargement de la photo');
    } finally {
      setPhotosUploading((s) => ({ ...s, [index]: false }));
    }
  };

  if (isLoading || !booking) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner />
          </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  if (booking.status !== 'IN_PROGRESS' && booking.status !== 'LATE') {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="max-w-lg mx-auto py-12 px-4">
            <p className="text-text-muted">
              Le check-out nécessite une location en cours. Statut actuel :{' '}
              <strong>{booking.status}</strong>.
            </p>
            <Link href={`/agency/bookings/${bookingId}`}>
              <Button variant="ghost" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la réservation
              </Button>
            </Link>
          </div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-8">
          <Link href={`/agency/bookings/${bookingId}`}>
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-text">Check-out terrain</h1>
            <p className="text-sm text-text-muted mt-1">
              Retour véhicule depuis le compte manager ou entreprise — équivalent app agent.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Kilométrage retour *</label>
                <Input
                  type="number"
                  min={0}
                  data-testid="check-out-odometer"
                  value={odometerEnd}
                  onChange={(e) => setOdometerEnd(e.target.value)}
                  placeholder={booking.vehicle?.mileage != null ? String(booking.vehicle.mileage) : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Carburant retour *</label>
                <Select value={fuelLevelEnd} onChange={(e) => setFuelLevelEnd(e.target.value as BookingFuelLevel)}>
                  {FUEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Quatre photos du véhicule au retour *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <label
                    key={i}
                    className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-background min-h-[100px]"
                  >
                    <span className="text-xs text-text-muted text-center mb-1">Photo {i + 1}</span>
                    {photosAfter[i] ? (
                      <span className="text-xs text-green-600">OK</span>
                    ) : (
                      <span className="text-xs text-text-muted">Choisir</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid={`check-out-photo-${i}`}
                      disabled={!!photosUploading[i]}
                      onChange={(e) => handleUploadAt(i, e.target.files?.[0] || null)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Notes retour</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={notesEnd}
                onChange={(e) => setNotesEnd(e.target.value)}
                maxLength={500}
              />
            </div>

            <TerrainDamagesEditor
              title="Nouveaux dommages (optionnel)"
              description="Constats au retour : une photo minimum par ligne, comme sur l’app mobile."
              value={newDamages}
              onChange={setNewDamages}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Frais supplémentaires (MAD)</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  data-testid="check-out-extra-fees"
                  value={extraFees}
                  onChange={(e) => setExtraFees(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Frais dégâts (MAD)</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  data-testid="check-out-damage-fee"
                  value={damageFee}
                  onChange={(e) => setDamageFee(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  data-testid="check-out-cash-collected"
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                />
                Encaissement espèces
              </label>
              {cashCollected && (
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Montant MAD"
                  data-testid="check-out-cash-amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Signature retour *</label>
              <SimpleSignaturePad onChange={setSignature} />
            </div>

            <Button
              variant="primary"
              className="w-full sm:w-auto"
              data-testid="check-out-submit"
              disabled={checkOutMutation.isPending}
              onClick={() => checkOutMutation.mutate()}
            >
              {checkOutMutation.isPending ? 'Enregistrement…' : 'Valider le check-out'}
            </Button>
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
