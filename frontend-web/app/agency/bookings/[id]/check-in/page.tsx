'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

export default function BookingCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [odometerStart, setOdometerStart] = useState('');
  const [fuelLevelStart, setFuelLevelStart] = useState<BookingFuelLevel>('FULL');
  const [photosBefore, setPhotosBefore] = useState<string[]>(['', '', '', '']);
  const [photosUploading, setPhotosUploading] = useState<Record<number, boolean>>({});
  const [notesStart, setNotesStart] = useState('');
  const [driverLicensePhoto, setDriverLicensePhoto] = useState('');
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [identityDocument, setIdentityDocument] = useState('');
  const [idUploading, setIdUploading] = useState(false);
  const [depositStatusCheckIn, setDepositStatusCheckIn] = useState<'PENDING' | 'COLLECTED'>('PENDING');
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [existingDamages, setExistingDamages] = useState<TerrainDamagePayload[]>([]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.getOne(bookingId),
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (!booking?.vehicle?.mileage && booking?.vehicle?.mileage !== 0) return;
    setOdometerStart(String(booking.vehicle.mileage));
  }, [booking?.vehicle?.mileage]);

  useEffect(() => {
    if (!booking?.client?.licenseExpiryDate) return;
    const d = new Date(booking.client.licenseExpiryDate);
    if (!Number.isNaN(d.getTime())) {
      setDriverLicenseExpiry(d.toISOString().slice(0, 10));
    }
  }, [booking?.client?.licenseExpiryDate]);

  useEffect(() => {
    if (!booking?.depositRequired) return;
    setDepositStatusCheckIn('PENDING');
  }, [booking?.depositRequired]);

  const checkInMutation = useMutation({
    mutationFn: () => {
      const odo = Number(odometerStart);
      if (Number.isNaN(odo) || odo < 0) {
        throw new Error('Kilométrage départ invalide');
      }
      const filled = photosBefore.filter(Boolean);
      if (filled.length < 4) {
        throw new Error('Quatre photos véhicule avant départ sont requises');
      }
      if (!driverLicensePhoto) {
        throw new Error('Photo du permis requise');
      }
      if (!driverLicenseExpiry) {
        throw new Error('Date d’expiration du permis requise');
      }
      if (!signature) {
        throw new Error('Signature du conducteur requise');
      }
      if (booking?.depositRequired && depositStatusCheckIn !== 'COLLECTED') {
        throw new Error('La caution doit être indiquée comme collectée avant le check-in');
      }
      for (const d of existingDamages) {
        if (d.photos.length < 1) {
          throw new Error('Chaque dommage déclaré doit avoir au moins une photo');
        }
      }
      const damagePayload =
        existingDamages.length > 0
          ? existingDamages.map((d) => ({
              zone: d.zone,
              type: d.type,
              severity: d.severity,
              description: d.description?.trim() || undefined,
              photos: d.photos,
            }))
          : undefined;
      return bookingApi.checkIn(bookingId, {
        odometerStart: odo,
        fuelLevelStart,
        photosBefore: filled,
        notesStart: notesStart.trim() || undefined,
        existingDamages: damagePayload,
        driverLicensePhoto,
        driverLicenseExpiry: new Date(driverLicenseExpiry).toISOString(),
        identityDocument: identityDocument || undefined,
        extractionStatus: 'OK',
        depositStatusCheckIn: booking?.depositRequired ? depositStatusCheckIn : undefined,
        signature,
      });
    },
    onSuccess: async () => {
      toast.success('Check-in enregistré — véhicule en location');
      await queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      router.push(`/agency/bookings/${bookingId}`);
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = ax?.response?.data?.message || (err instanceof Error ? err.message : undefined);
      toast.error(msg || 'Erreur check-in');
    },
  });

  const handleUploadAt = async (index: number, file: File | null) => {
    if (!file) return;
    setPhotosUploading((s) => ({ ...s, [index]: true }));
    try {
      const { url } = await uploadApi.uploadFile(file);
      setPhotosBefore((prev) => {
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

  const handleLicenseUpload = async (file: File | null) => {
    if (!file) return;
    setLicenseUploading(true);
    try {
      const { url } = await uploadApi.uploadFile(file);
      setDriverLicensePhoto(url);
      toast.success('Photo permis enregistrée');
    } catch {
      toast.error('Échec du téléchargement permis');
    } finally {
      setLicenseUploading(false);
    }
  };

  const handleIdUpload = async (file: File | null) => {
    if (!file) return;
    setIdUploading(true);
    try {
      const { url } = await uploadApi.uploadFile(file);
      setIdentityDocument(url);
      toast.success('Pièce d’identité enregistrée');
    } catch {
      toast.error('Échec du téléchargement');
    } finally {
      setIdUploading(false);
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

  if (booking.status !== 'CONFIRMED' && booking.status !== 'PICKUP_LATE') {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
        <MainLayout>
          <div className="max-w-lg mx-auto py-12 px-4">
            <p className="text-text-muted">
              Le check-in n’est possible que pour une réservation confirmée ou en retard au départ. Statut actuel :{' '}
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
            <h1 className="text-2xl font-bold text-text">Check-in terrain</h1>
            <p className="text-sm text-text-muted mt-1">
              Remplacement agent (PC / tablette) — même flux que l’app mobile : photos, kilométrage,
              permis, signature.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Kilométrage départ *</label>
                <Input
                  type="number"
                  min={0}
                  data-testid="check-in-odometer"
                  value={odometerStart}
                  onChange={(e) => setOdometerStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Carburant départ *</label>
                <Select value={fuelLevelStart} onChange={(e) => setFuelLevelStart(e.target.value as BookingFuelLevel)}>
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
                Quatre photos du véhicule avant départ *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <label
                    key={i}
                    className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-background min-h-[100px]"
                  >
                    <span className="text-xs text-text-muted text-center mb-1">Photo {i + 1}</span>
                    {photosBefore[i] ? (
                      <span className="text-xs text-green-600">OK</span>
                    ) : (
                      <span className="text-xs text-text-muted">Choisir</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid={`check-in-photo-${i}`}
                      disabled={!!photosUploading[i]}
                      onChange={(e) => handleUploadAt(i, e.target.files?.[0] || null)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Notes départ</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={notesStart}
                onChange={(e) => setNotesStart(e.target.value)}
                maxLength={500}
              />
            </div>

            <TerrainDamagesEditor
              title="Dommages existants (optionnel)"
              description="Même structure que l’app mobile : zone, type, gravité et au moins une photo par dommage."
              value={existingDamages}
              onChange={setExistingDamages}
            />

            <div className="border-t border-border pt-6 space-y-4">
              <h2 className="text-sm font-semibold text-text">Permis & pièces</h2>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Date expiration permis *</label>
                <Input
                  type="date"
                  data-testid="check-in-license-expiry"
                  value={driverLicenseExpiry}
                  onChange={(e) => setDriverLicenseExpiry(e.target.value)}
                />
                <p className="text-xs text-text-muted mt-1">
                  Doit correspondre à une fiche client valide côté serveur (permis non expiré, couvrant la fin de
                  location).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Photo permis *</label>
                <Input
                  type="file"
                  accept="image/*"
                  data-testid="check-in-license"
                  disabled={licenseUploading}
                  onChange={(e) => handleLicenseUpload(e.target.files?.[0] || null)}
                />
                {driverLicensePhoto && <p className="text-xs text-green-600 mt-1">Fichier joint</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Pièce d’identité (optionnel)</label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  data-testid="check-in-identity"
                  disabled={idUploading}
                  onChange={(e) => handleIdUpload(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {booking.depositRequired && (
              <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-text">Caution requise sur cette réservation</p>
                <label className="block text-sm text-text-muted">Statut au départ</label>
                <Select
                  data-testid="check-in-deposit-status"
                  value={depositStatusCheckIn}
                  onChange={(e) => setDepositStatusCheckIn(e.target.value as 'PENDING' | 'COLLECTED')}
                >
                  <option value="PENDING">En attente (bloque le check-in)</option>
                  <option value="COLLECTED">Collectée</option>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-2">Signature conducteur *</label>
              <SimpleSignaturePad onChange={setSignature} />
            </div>

            <Button
              variant="primary"
              className="w-full sm:w-auto"
              data-testid="check-in-submit"
              disabled={checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
            >
              {checkInMutation.isPending ? 'Enregistrement…' : 'Valider le check-in'}
            </Button>
          </div>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
