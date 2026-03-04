'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { companyApi, CreateCompanyDto } from '@/lib/api/company';
import { planApi, Plan } from '@/lib/api/plan';
import { saasSettingsApi } from '@/lib/api/saas-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  VEHICLES: 'Véhicules',
  BOOKINGS: 'Réservations',
  INVOICES: 'Facturation',
  MAINTENANCE: 'Maintenance',
  FINES: 'Amendes',
  ANALYTICS: 'Analytics',
};

const ALL_MODULE_CODES = Object.keys(MODULE_LABELS);

export default function NewCompanyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateCompanyDto>({
    name: '',
    raisonSociale: '',
    identifiantLegal: '',
    formeJuridique: 'AUTRE',
    phone: '',
    address: '',
    adminEmail: '',
    adminName: '',
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCustomMaxAgencies, setIsCustomMaxAgencies] = useState(false);
  const [additionalModuleCodes, setAdditionalModuleCodes] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => planApi.getAll(),
  });
  const { data: saasSettings } = useQuery({
    queryKey: ['saas-settings'],
    queryFn: () => saasSettingsApi.get(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyDto) => companyApi.create(data),
    onSuccess: (createdCompany) => {
      toast.success('Entreprise créée. Configurez maintenant les modules.');
      router.push(`/admin/companies/${createdCompany.id}?section=modules`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
      setErrors({ submit: message });
      toast.error(message);
    },
  });

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  const selectedPlanAgencyQuota = useMemo(() => {
    if (!selectedPlan) return undefined;
    const quota = selectedPlan.planQuotas.find(
      (q) =>
        q.quotaKey === 'agencies' ||
        q.quotaKey === 'max_agencies' ||
        q.quotaKey === 'maxAgencies',
    );
    return quota?.quotaValue;
  }, [selectedPlan]);

  useEffect(() => {
    if (!selectedPlan || isCustomMaxAgencies) return;

    if (selectedPlanAgencyQuota === undefined || selectedPlanAgencyQuota === -1) {
      setFormData((prev) => ({ ...prev, maxAgencies: undefined }));
      return;
    }

    setFormData((prev) => ({ ...prev, maxAgencies: selectedPlanAgencyQuota }));
  }, [selectedPlan, selectedPlanAgencyQuota, isCustomMaxAgencies]);

  const planModuleCodes = useMemo(
    () => (selectedPlan ? selectedPlan.planModules.map((m) => m.moduleCode) : []),
    [selectedPlan],
  );

  const availableAdditionalModules = useMemo(
    () => ALL_MODULE_CODES.filter((code) => !planModuleCodes.includes(code)),
    [planModuleCodes],
  );

  useEffect(() => {
    setAdditionalModuleCodes((prev) => prev.filter((code) => availableAdditionalModules.includes(code)));
  }, [availableAdditionalModules]);

  const extraAgenciesCount = useMemo(() => {
    if (
      selectedPlanAgencyQuota === undefined ||
      selectedPlanAgencyQuota < 0 ||
      formData.maxAgencies === undefined
    ) {
      return 0;
    }
    return Math.max(0, formData.maxAgencies - selectedPlanAgencyQuota);
  }, [selectedPlanAgencyQuota, formData.maxAgencies]);

  const estimatedMonthlyAmount = useMemo(() => {
    if (!selectedPlan) return undefined;
    const extraAgencyUnitPrice = saasSettings?.extraAgencyPriceMad ?? 0;
    const extraModuleUnitPrice = saasSettings?.extraModulePriceMad ?? 0;
    return selectedPlan.price + extraAgenciesCount * extraAgencyUnitPrice + additionalModuleCodes.length * extraModuleUnitPrice;
  }, [
    selectedPlan,
    extraAgenciesCount,
    additionalModuleCodes.length,
    saasSettings?.extraAgencyPriceMad,
    saasSettings?.extraModulePriceMad,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name) {
      setErrors({ name: 'Le nom est requis' });
      return;
    }

    if (!formData.raisonSociale) {
      setErrors({ raisonSociale: 'La raison sociale est requise' });
      return;
    }

    if (!formData.identifiantLegal) {
      setErrors({ identifiantLegal: "L'identifiant légal est requis" });
      return;
    }

    if (!formData.formeJuridique) {
      setErrors({ formeJuridique: 'La forme juridique est requise' });
      return;
    }

    if (
      selectedPlan &&
      saasSettings &&
      !saasSettings.allowAgencyOverageOnCreate &&
      extraAgenciesCount > 0
    ) {
      setErrors({
        submit:
          "Le depassement du quota d'agences est desactive dans les Parametres SaaS.",
      });
      return;
    }

    const payload = selectedPlanId
      ? {
          ...formData,
          planId: selectedPlanId,
          additionalModuleCodes: saasSettings?.allowAdditionalModulesOnCreate
            ? additionalModuleCodes
            : [],
        }
      : formData;
    createMutation.mutate(payload);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-4">
            <p className="text-sm text-text-muted">
              Workflow: création entreprise + plan initial, puis configuration détaillée des modules à l&apos;étape suivante.
            </p>
          </Card>
          <FormCard
            title="Nouvelle entreprise"
            description="Remplissez les informations pour créer une nouvelle entreprise"
            backHref="/admin/companies"
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="Créer l'entreprise"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nom de l'entreprise *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Location Auto Maroc"
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="raisonSociale" className="block text-sm font-medium text-text mb-2">
                Raison sociale *
              </label>
              <Input
                id="raisonSociale"
                value={formData.raisonSociale}
                onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                placeholder="Ex: Location Auto Maroc SARL"
                required
              />
              {errors.raisonSociale && <p className="text-red-500 text-sm mt-1">{errors.raisonSociale}</p>}
            </div>

            <div>
              <label htmlFor="identifiantLegal" className="block text-sm font-medium text-text mb-2">
                Identifiant légal (ICE) *
              </label>
              <Input
                id="identifiantLegal"
                value={formData.identifiantLegal}
                onChange={(e) => setFormData({ ...formData, identifiantLegal: e.target.value })}
                placeholder="Ex: 001234567000089"
                required
              />
              {errors.identifiantLegal && <p className="text-red-500 text-sm mt-1">{errors.identifiantLegal}</p>}
            </div>

            <div>
              <label htmlFor="formeJuridique" className="block text-sm font-medium text-text mb-2">
                Forme juridique *
              </label>
              <select
                id="formeJuridique"
                value={formData.formeJuridique}
                onChange={(e) => setFormData({ ...formData, formeJuridique: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
                required
              >
                <option value="SARL">SARL</option>
                <option value="SAS">SAS</option>
                <option value="SA">SA</option>
                <option value="EI">EI</option>
                <option value="AUTO_ENTREPRENEUR">Auto-entrepreneur</option>
                <option value="ASSOCIATION">Association</option>
                <option value="AUTRE">Autre</option>
              </select>
              {errors.formeJuridique && <p className="text-red-500 text-sm mt-1">{errors.formeJuridique}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxAgencies" className="block text-sm font-medium text-text mb-2">
                  Nombre max d&apos;agences
                </label>
                <Input
                  id="maxAgencies"
                  type="number"
                  min="0"
                  value={formData.maxAgencies ?? ''}
                  onChange={(e) => {
                    setIsCustomMaxAgencies(true);
                    setFormData({ ...formData, maxAgencies: e.target.value ? parseInt(e.target.value) : undefined });
                  }}
                  placeholder="Illimite si vide"
                />
                <p className="text-xs text-text-muted mt-1">
                  Laisser vide pour illimité
                  {selectedPlanAgencyQuota !== undefined && (
                    <>. Quota du pack: {selectedPlanAgencyQuota === -1 ? 'Illimité' : selectedPlanAgencyQuota}</>
                  )}
                </p>
                {isCustomMaxAgencies && selectedPlan && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-primary hover:underline"
                    onClick={() => {
                      setIsCustomMaxAgencies(false);
                      if (selectedPlanAgencyQuota === undefined || selectedPlanAgencyQuota === -1) {
                        setFormData((prev) => ({ ...prev, maxAgencies: undefined }));
                      } else {
                        setFormData((prev) => ({ ...prev, maxAgencies: selectedPlanAgencyQuota }));
                      }
                    }}
                  >
                    Revenir au quota du pack
                  </button>
                )}
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
                placeholder="+212 6XX XXX XXX"
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
                placeholder="Adresse complete"
              />
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-text mb-4">Administrateur (optionnel)</h2>
              <p className="text-sm text-text-muted mb-4">
                Créer un compte administrateur pour cette entreprise
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium text-text mb-2">
                    Nom de l'administrateur
                  </label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="Nom complet"
                  />
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-text mb-2">
                    Email de l'administrateur
                  </label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@entreprise.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-text mb-2">Plan / Package</h2>
              <p className="text-sm text-text-muted mb-4">
                Sélectionnez un plan pour créer l&apos;abonnement initial. Les modules inclus sont activés automatiquement, puis vous pourrez ajouter/retirer des modules à l&apos;étape suivante.
              </p>

              {plans.length === 0 ? (
                <p className="text-sm text-text-muted italic">Aucun plan disponible. Créez-en un depuis la page Plans.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                        className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40 bg-card'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-primary" />
                        )}
                        <h3 className="font-semibold text-text">{plan.name}</h3>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {plan.price} <span className="text-sm font-normal text-text-muted">MAD/mois</span>
                        </p>
                        {plan.description && (
                          <p className="text-xs text-text-muted mt-1">{plan.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {plan.planModules.map((m) => (
                            <Badge key={m.moduleCode} variant="outline" className="text-[10px]">
                              {MODULE_LABELS[m.moduleCode] || m.moduleCode}
                            </Badge>
                          ))}
                        </div>
                        {plan.planQuotas.length > 0 && (
                          <div className="mt-2 text-xs text-text-muted space-y-0.5">
                            {plan.planQuotas.map((q) => (
                              <p key={q.quotaKey}>
                                {q.quotaKey === 'agencies' ? 'Agences' : q.quotaKey === 'users' ? 'Utilisateurs' : q.quotaKey === 'vehicles' ? 'Véhicules' : q.quotaKey}
                                : {q.quotaValue === -1 ? 'Illimité' : q.quotaValue}
                              </p>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedPlan && (
                <Card className="mt-4 p-4 border border-primary/30 bg-primary/5">
                  <h3 className="font-semibold text-text">Résumé du pack sélectionné</h3>
                  <p className="text-sm text-text-muted mt-1">
                    Prix de base appliqué à la création: <span className="text-text font-medium">{selectedPlan.price} MAD/mois</span>
                  </p>
                  <div className="mt-3 text-sm text-text-muted space-y-1">
                    <p>
                      Agences incluses dans le pack:{' '}
                      <span className="text-text">
                        {selectedPlanAgencyQuota === undefined
                          ? 'Non défini'
                          : selectedPlanAgencyQuota === -1
                            ? 'Illimité'
                            : selectedPlanAgencyQuota}
                      </span>
                    </p>
                    <p>
                      Limite agences configurée pour l&apos;entreprise:{' '}
                      <span className="text-text">
                        {formData.maxAgencies === undefined ? 'Illimité' : formData.maxAgencies}
                      </span>
                    </p>
                    <p>
                      Agences supplémentaires facturées:{' '}
                      <span className="text-text">{extraAgenciesCount}</span>
                    </p>
                    <p>
                      Modules supplémentaires sélectionnés:{' '}
                      <span className="text-text">{additionalModuleCodes.length}</span>
                    </p>
                  </div>
                  {selectedPlanAgencyQuota !== undefined &&
                    selectedPlanAgencyQuota >= 0 &&
                    formData.maxAgencies !== undefined &&
                    formData.maxAgencies > selectedPlanAgencyQuota && (
                      <p className="mt-3 text-sm text-amber-500">
                        La limite d&apos;agences dépasse le quota du pack. Le montant estimé inclut automatiquement ce dépassement.
                      </p>
                    )}
                  <p className="mt-2 text-xs text-text-muted">
                    Les modules inclus sont activés automatiquement. Vous pourrez ajouter d&apos;autres modules après création (Étape 2).
                  </p>
                  <div className="mt-4 text-xs text-text-muted space-y-1">
                    <p>
                      Prix agence supplementaire (global):{' '}
                      <span className="text-text">{saasSettings?.extraAgencyPriceMad ?? 0} MAD/mois</span>
                    </p>
                    <p>
                      Prix module supplementaire (global):{' '}
                      <span className="text-text">{saasSettings?.extraModulePriceMad ?? 0} MAD/mois</span>
                    </p>
                    <p>
                      Regles modifiables depuis{' '}
                      <span className="text-text">Administration &gt; Parametres SaaS</span>.
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-medium text-text mb-2">Modules additionnels à activer dès création</p>
                    {saasSettings && !saasSettings.allowAdditionalModulesOnCreate && (
                      <p className="text-xs text-amber-500 mb-2">
                        L ajout de modules additionnels a la creation est desactive dans les Parametres SaaS.
                      </p>
                    )}
                    {availableAdditionalModules.length === 0 ? (
                      <p className="text-xs text-text-muted">Tous les modules sont déjà inclus dans ce pack.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableAdditionalModules.map((code) => {
                          const checked = additionalModuleCodes.includes(code);
                          return (
                            <button
                              key={code}
                              type="button"
                              disabled={!!saasSettings && !saasSettings.allowAdditionalModulesOnCreate}
                              onClick={() =>
                                setAdditionalModuleCodes((prev) =>
                                  checked ? prev.filter((c) => c !== code) : [...prev, code],
                                )
                              }
                              className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                                checked
                                  ? 'border-primary bg-primary/15 text-text'
                                  : 'border-border bg-card text-text-muted hover:border-primary/40'
                              } ${!!saasSettings && !saasSettings.allowAdditionalModulesOnCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {MODULE_LABELS[code] || code}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-sm">
                    Montant mensuel estimé:{' '}
                    <span className="font-semibold text-text">
                      {estimatedMonthlyAmount ?? selectedPlan.price} MAD/mois
                    </span>
                  </p>
                </Card>
              )}
            </div>

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
              {errors.submit}
            </div>
          )}
          </FormCard>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

