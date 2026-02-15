'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, UpdateCompanyDto } from '@/lib/api/company';
import { moduleApi, ModuleCode, CompanyModule } from '@/lib/api/module';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FormCard } from '@/components/ui/form-card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

const ALL_MODULES: { code: ModuleCode; label: string; description: string }[] = [
  { code: 'VEHICLES', label: 'Véhicules', description: 'Gestion du parc, GPS, charges' },
  { code: 'BOOKINGS', label: 'Réservations', description: 'Locations, planning, contrats' },
  { code: 'INVOICES', label: 'Facturation', description: 'Factures, avoirs, PDF' },
  { code: 'MAINTENANCE', label: 'Maintenance', description: 'Entretien et réparations' },
  { code: 'FINES', label: 'Amendes', description: 'Gestion des infractions' },
  { code: 'ANALYTICS', label: 'Analytics', description: 'KPI et tableaux de bord' },
];

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyApi.getById(id),
    enabled: !!id,
  });

  const [formData, setFormData] = useState<UpdateCompanyDto>({
    name: '',
    raisonSociale: '',
    identifiantLegal: '',
    formeJuridique: 'AUTRE',
    maxAgencies: undefined,
    bookingNumberMode: 'AUTO',
    phone: '',
    address: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        raisonSociale: (company as any).raisonSociale || '',
        identifiantLegal: (company as any).identifiantLegal || '',
        formeJuridique: (company as any).formeJuridique || 'AUTRE',
        maxAgencies: (company as any).maxAgencies ?? undefined,
        bookingNumberMode: (company as any).bookingNumberMode || 'AUTO',
        phone: company.phone || '',
        address: company.address || '',
        isActive: company.isActive,
      });
    }
  }, [company]);

  // --- Modules management (hooks must be before any conditional return) ---
  const { data: companyModules, isLoading: modulesLoading } = useQuery({
    queryKey: ['company-modules', id],
    queryFn: () => moduleApi.getCompanyModules(id),
    enabled: !!id,
  });

  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyDto) => companyApi.update(id, data),
    onSuccess: () => {
      toast.success('Entreprise mise à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      router.push('/admin/companies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      setErrors({ submit: message });
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name) {
      setErrors({ name: 'Le nom est requis' });
      return;
    }

    updateMutation.mutate(formData);
  };

  const isModuleActive = (code: ModuleCode): boolean => {
    if (!companyModules) return false;
    const mod = companyModules.find((m: CompanyModule) => m.moduleCode === code);
    return mod?.isActive ?? false;
  };

  const handleToggleModule = async (code: ModuleCode) => {
    setTogglingModule(code);
    try {
      if (isModuleActive(code)) {
        await moduleApi.deactivateCompanyModule(id, code);
        toast.success(`Module ${code} désactivé`);
      } else {
        await moduleApi.activateCompanyModule(id, code);
        toast.success(`Module ${code} activé`);
      }
      queryClient.invalidateQueries({ queryKey: ['company-modules', id] });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la modification du module';
      toast.error(msg);
    } finally {
      setTogglingModule(null);
    }
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <LoadingState message="Chargement de l'entreprise..." />
        </MainLayout>
      </RouteGuard>
    );
  }

  if (error || !company) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <ErrorState
            title="Entreprise non trouvée"
            message="L'entreprise demandée n'existe pas ou a été supprimée."
            onRetry={() => router.push('/admin/companies')}
          />
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-3xl mx-auto space-y-8">
          <FormCard
            title="Modifier l'entreprise"
            description="Mettez à jour les informations de l'entreprise"
            backHref="/admin/companies"
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            submitLabel="Mettre à jour"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nom de l&apos;entreprise *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="raisonSociale" className="block text-sm font-medium text-text mb-2">
                Raison sociale
              </label>
              <Input
                id="raisonSociale"
                value={formData.raisonSociale || ''}
                onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                placeholder="Ex: Location Auto Maroc SARL"
              />
            </div>

            <div>
              <label htmlFor="identifiantLegal" className="block text-sm font-medium text-text mb-2">
                Identifiant legal (ICE)
              </label>
              <Input
                id="identifiantLegal"
                value={formData.identifiantLegal || ''}
                onChange={(e) => setFormData({ ...formData, identifiantLegal: e.target.value })}
                placeholder="Ex: 001234567000089"
              />
            </div>

            <div>
              <label htmlFor="formeJuridique" className="block text-sm font-medium text-text mb-2">
                Forme juridique
              </label>
              <select
                id="formeJuridique"
                value={formData.formeJuridique || 'AUTRE'}
                onChange={(e) => setFormData({ ...formData, formeJuridique: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
              >
                <option value="SARL">SARL</option>
                <option value="SAS">SAS</option>
                <option value="SA">SA</option>
                <option value="EI">EI</option>
                <option value="AUTO_ENTREPRENEUR">Auto-entrepreneur</option>
                <option value="ASSOCIATION">Association</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxAgencies" className="block text-sm font-medium text-text mb-2">
                  Nombre max d&apos;agences
                </label>
                <Input
                  id="maxAgencies"
                  type="number"
                  min="0"
                  value={formData.maxAgencies ?? ''}
                  onChange={(e) => setFormData({ ...formData, maxAgencies: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Illimite si vide"
                />
                <p className="text-xs text-text-muted mt-1">Laisser vide pour illimite</p>
              </div>

              <div>
                <label htmlFor="bookingNumberMode" className="block text-sm font-medium text-text mb-2">
                  Mode N° reservation
                </label>
                <select
                  id="bookingNumberMode"
                  value={formData.bookingNumberMode || 'AUTO'}
                  onChange={(e) => setFormData({ ...formData, bookingNumberMode: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
                >
                  <option value="AUTO">Automatique</option>
                  <option value="MANUAL">Manuel</option>
                </select>
                <p className="text-xs text-text-muted mt-1">AUTO : genere automatiquement / MANUAL : saisi par l&apos;utilisateur</p>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
                Telephone
              </label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text mb-2">
                Adresse
              </label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-text">Entreprise active</span>
              </label>
            </div>

            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
                {errors.submit}
              </div>
            )}
          </FormCard>

          {/* Section Modules */}
          <Card>
            <CardHeader>
              <CardTitle>Modules activés</CardTitle>
              <p className="text-sm text-text-muted mt-1">
                Activez ou désactivez les modules pour cette entreprise. Les modules actifs seront disponibles pour toutes ses agences.
              </p>
            </CardHeader>
            <CardContent>
              {modulesLoading ? (
                <LoadingState message="Chargement des modules..." />
              ) : (
                <div className="space-y-3">
                  {ALL_MODULES.map((mod) => {
                    const active = isModuleActive(mod.code);
                    const toggling = togglingModule === mod.code;
                    return (
                      <div
                        key={mod.code}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          active
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div>
                          <h4 className="font-medium text-text">{mod.label}</h4>
                          <p className="text-sm text-text-muted">{mod.description}</p>
                        </div>
                        <button
                          onClick={() => handleToggleModule(mod.code)}
                          disabled={toggling}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                            active ? 'bg-primary' : 'bg-border'
                          } ${toggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
