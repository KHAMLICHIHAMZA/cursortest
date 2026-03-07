'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, UpdateCompanyDto } from '@/lib/api/company';
import { moduleApi, ModuleCode, CompanyModule } from '@/lib/api/module';
import { planApi } from '@/lib/api/plan';
import { subscriptionApi } from '@/lib/api/subscription';
import { saasSettingsApi } from '@/lib/api/saas-settings';
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
  { code: 'GPS', label: 'GPS', description: 'Géolocalisation et tracking' },
  { code: 'CONTRACTS', label: 'Contrats', description: 'Contrats de location' },
  { code: 'JOURNAL', label: 'Journal', description: 'Journal d activité' },
  { code: 'CHARGES', label: 'Charges', description: 'Charges et dépenses' },
  { code: 'NOTIFICATIONS', label: 'Notifications', description: 'Notifications in-app' },
];

const MODULE_LABELS: Record<ModuleCode, string> = ALL_MODULES.reduce((acc, item) => {
  acc[item.code] = item.label;
  return acc;
}, {} as Record<ModuleCode, string>);

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const sectionName = searchParams.get('section');
    if (sectionName !== 'modules' && sectionName !== 'subscription') return;
    const timer = setTimeout(() => {
      const section = document.getElementById(
        sectionName === 'subscription' ? 'subscription-section' : 'modules-section',
      );
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // --- Modules management (hooks must be before any conditional return) ---
  const { data: companyModules, isLoading: modulesLoading } = useQuery({
    queryKey: ['company-modules', id],
    queryFn: () => moduleApi.getCompanyModules(id),
    enabled: !!id,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription-by-company', id],
    queryFn: () => subscriptionApi.getByCompany(id),
    enabled: !!id,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planApi.getAll(),
  });

  const { data: saasSettings } = useQuery({
    queryKey: ['saas-settings'],
    queryFn: () => saasSettingsApi.get(),
  });

  const { data: moduleDependencies = [] } = useQuery({
    queryKey: ['module-dependencies'],
    queryFn: () => moduleApi.getDependencies(),
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [draftMaxAgencies, setDraftMaxAgencies] = useState<string>('');
  const [additionalModuleCodes, setAdditionalModuleCodes] = useState<ModuleCode[]>([]);
  const [packError, setPackError] = useState<string>('');

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const selectedPlanQuotaAgencies = useMemo(() => {
    if (!selectedPlan) return undefined;
    const quota = selectedPlan.planQuotas.find(
      (q) =>
        q.quotaKey === 'agencies' ||
        q.quotaKey === 'max_agencies' ||
        q.quotaKey === 'maxAgencies',
    );
    return quota?.quotaValue;
  }, [selectedPlan]);

  const selectedPlanModuleCodes = useMemo(
    () => (selectedPlan ? selectedPlan.planModules.map((mod) => mod.moduleCode as ModuleCode) : []),
    [selectedPlan],
  );

  const additionalModuleCandidates = useMemo(
    () => ALL_MODULES.map((m) => m.code).filter((code) => !selectedPlanModuleCodes.includes(code)),
    [selectedPlanModuleCodes],
  );

  const dependencyMap = useMemo(() => {
    const map = new Map<ModuleCode, ModuleCode[]>();
    for (const dep of moduleDependencies) {
      const current = map.get(dep.moduleCode) ?? [];
      current.push(dep.dependsOnCode);
      map.set(dep.moduleCode, current);
    }
    return map;
  }, [moduleDependencies]);

  const dependentMap = useMemo(() => {
    const map = new Map<ModuleCode, ModuleCode[]>();
    for (const dep of moduleDependencies) {
      const current = map.get(dep.dependsOnCode) ?? [];
      current.push(dep.moduleCode);
      map.set(dep.dependsOnCode, current);
    }
    return map;
  }, [moduleDependencies]);

  const simulationInputMaxAgencies =
    draftMaxAgencies.trim() === '' ? undefined : Number(draftMaxAgencies);
  const { data: pricingSimulation } = useQuery({
    queryKey: [
      'saas-pricing-simulation',
      selectedPlanId,
      simulationInputMaxAgencies ?? null,
      additionalModuleCodes.join(','),
    ],
    queryFn: () =>
      saasSettingsApi.simulatePricing({
        planId: selectedPlanId || undefined,
        maxAgencies:
          simulationInputMaxAgencies !== undefined && Number.isFinite(simulationInputMaxAgencies)
            ? simulationInputMaxAgencies
            : undefined,
        additionalModuleCodes,
      }),
    enabled: !!selectedPlanId,
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

  const initializeSubscriptionMutation = useMutation({
    mutationFn: (payload: {
      planId: string;
      maxAgencies?: number;
      additionalModuleCodes?: string[];
    }) => companyApi.initializeSubscription(id, payload),
    onSuccess: () => {
      toast.success('Pack applique avec succes. Passez a l activation des modules.');
      queryClient.invalidateQueries({ queryKey: ['subscription-by-company', id] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['company-modules', id] });
      router.replace(`/admin/companies/${id}?section=modules`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de l initialisation du pack';
      setPackError(message);
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

  const getDependenciesRecursively = (startCode: ModuleCode): ModuleCode[] => {
    const result = new Set<ModuleCode>();
    const stack = [startCode];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      const deps = dependencyMap.get(current) ?? [];
      for (const dep of deps) {
        if (!result.has(dep)) {
          result.add(dep);
          stack.push(dep);
        }
      }
    }
    return Array.from(result);
  };

  const hasSelectedDependents = (code: ModuleCode, selectedCodes: ModuleCode[]) => {
    const dependents = dependentMap.get(code) ?? [];
    return selectedCodes.some((selected) => dependents.includes(selected));
  };

  const toggleAdditionalModule = (code: ModuleCode) => {
    setPackError('');
    if (additionalModuleCodes.includes(code)) {
      const dependents = dependentMap.get(code) ?? [];
      const blockers = additionalModuleCodes.filter((selected) => dependents.includes(selected));
      if (blockers.length > 0) {
        toast.error(
          `Impossible de retirer ${MODULE_LABELS[code] || code}: requis par ${blockers
            .map((item) => MODULE_LABELS[item] || item)
            .join(', ')}`,
        );
        return;
      }
    }

    setAdditionalModuleCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((item) => item !== code);
      }

      const next = new Set<ModuleCode>(prev);
      next.add(code);
      const deps = getDependenciesRecursively(code)
        .filter((depCode) => !selectedPlanModuleCodes.includes(depCode));
      deps.forEach((depCode) => next.add(depCode));
      return Array.from(next);
    });
  };

  const handleInitializeSubscription = () => {
    if (!selectedPlanId) {
      setPackError('Selectionnez un pack pour continuer.');
      return;
    }
    setPackError('');
    const parsed =
      draftMaxAgencies.trim() === '' ? undefined : Number.parseInt(draftMaxAgencies, 10);
    const maxAgencies = Number.isFinite(parsed as number) ? parsed : undefined;

    initializeSubscriptionMutation.mutate({
      planId: selectedPlanId,
      maxAgencies,
      additionalModuleCodes,
    });
  };

  const isModuleActive = (code: ModuleCode): boolean => {
    if (!companyModules) return false;
    const mod = companyModules.find((m: CompanyModule) => m.moduleCode === code);
    return mod?.isActive ?? false;
  };

  const requiredByActiveMap = useMemo(() => {
    const map = new Map<ModuleCode, ModuleCode[]>();
    const activeCodes = new Set<ModuleCode>(
      (companyModules || [])
        .filter((item: CompanyModule) => item.isActive)
        .map((item: CompanyModule) => item.moduleCode),
    );

    for (const dep of moduleDependencies) {
      if (!activeCodes.has(dep.moduleCode)) continue;
      const current = map.get(dep.dependsOnCode) ?? [];
      current.push(dep.moduleCode);
      map.set(dep.dependsOnCode, current);
    }

    return map;
  }, [companyModules, moduleDependencies]);

  const handleToggleModule = async (code: ModuleCode) => {
    setTogglingModule(code);
    try {
      if (isModuleActive(code)) {
        const requiredBy = requiredByActiveMap.get(code) ?? [];
        if (requiredBy.length > 0) {
          toast.error(
            `Module requis par: ${requiredBy.map((c) => MODULE_LABELS[c] || c).join(', ')}`,
          );
          return;
        }
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
        <div className="max-w-4xl mx-auto space-y-6">
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

          <Card id="subscription-section">
            <CardHeader>
              <CardTitle>Pack et abonnement initial</CardTitle>
              <p className="text-sm text-text-muted mt-1">
                Étape 2: choisissez le pack après création. Les modules dépendants sont auto-ajoutés.
              </p>
              {searchParams.get('section') === 'subscription' && (
                <p className="text-xs text-primary mt-2">
                  Étape 2 en cours: choisissez un pack, puis finalisez les modules.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {subscriptionLoading ? (
                <LoadingState message="Chargement de l abonnement..." />
              ) : subscription ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-1 text-sm">
                  <p>
                    Pack actif: <span className="font-medium text-text">{subscription.plan?.name || '-'}</span>
                  </p>
                  <p>
                    Montant actuel: <span className="font-medium text-text">{subscription.amount} MAD/mois</span>
                  </p>
                  <p className="text-xs text-text-muted">
                    Un abonnement existe déjà pour cette entreprise. Passez directement à la gestion des modules.
                  </p>
                  <div className="pt-2">
                    <Button variant="secondary" onClick={() => router.replace(`/admin/companies/${id}?section=modules`)}>
                      Aller aux modules
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Pack</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => {
                        setSelectedPlanId(e.target.value);
                        setAdditionalModuleCodes([]);
                        setPackError('');
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
                    >
                      <option value="">Choisir un pack</option>
                      {plans
                        .filter((plan) => plan.isActive)
                        .map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price} MAD/mois
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedPlan && (
                    <>
                      <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                        <p>
                          Prix pack: <span className="font-medium text-text">{selectedPlan.price} MAD/mois</span>
                        </p>
                        <p>
                          Agences incluses:{' '}
                          <span className="text-text">
                            {selectedPlanQuotaAgencies === undefined
                              ? 'Non défini'
                              : selectedPlanQuotaAgencies === -1
                                ? 'Illimité'
                                : selectedPlanQuotaAgencies}
                          </span>
                        </p>
                        <p>
                          Modules inclus:{' '}
                          <span className="text-text">
                            {selectedPlanModuleCodes.map((code) => MODULE_LABELS[code] || code).join(', ')}
                          </span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Nombre max d agences (optionnel)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={draftMaxAgencies}
                          onChange={(e) => setDraftMaxAgencies(e.target.value)}
                          placeholder={
                            selectedPlanQuotaAgencies === -1
                              ? 'Illimite'
                              : selectedPlanQuotaAgencies !== undefined
                                ? String(selectedPlanQuotaAgencies)
                                : 'Laisser vide'
                          }
                        />
                        <p className="text-xs text-text-muted mt-1">
                          Laisser vide pour reprendre le quota du pack.
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-text mb-2">Modules additionnels</p>
                        <div className="flex flex-wrap gap-2">
                          {additionalModuleCandidates.map((code) => {
                            const checked = additionalModuleCodes.includes(code);
                            const lockedByDependents = hasSelectedDependents(code, additionalModuleCodes);
                            const deps = dependencyMap.get(code) ?? [];
                            return (
                              <button
                                key={code}
                                type="button"
                                onClick={() => toggleAdditionalModule(code)}
                                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                                  checked
                                    ? 'border-primary bg-primary/15 text-text'
                                    : 'border-border bg-card text-text-muted hover:border-primary/40'
                                } ${lockedByDependents ? 'opacity-80' : ''}`}
                                title={
                                  deps.length > 0
                                    ? `Dependances: ${deps.map((d) => MODULE_LABELS[d] || d).join(', ')}`
                                    : undefined
                                }
                              >
                                {MODULE_LABELS[code] || code}
                                {deps.length > 0 ? ' *' : ''}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                          * Les dependances sont auto-ajoutees et verrouillees si un module actif en depend.
                        </p>
                      </div>
                    </>
                  )}

                  {pricingSimulation && (
                    <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                      <p>
                        Montant estime: <span className="font-semibold text-text">{pricingSimulation.monthlyAmount} MAD/mois</span>
                      </p>
                      <p>
                        Agences supplementaires facturees:{' '}
                        <span className="text-text">{pricingSimulation.breakdown.extraAgenciesCount}</span>
                      </p>
                      {pricingSimulation.validationErrors.length > 0 && (
                        <p className="text-amber-500 text-xs">
                          {pricingSimulation.validationErrors.join(' | ')}
                        </p>
                      )}
                    </div>
                  )}

                  {packError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                      {packError}
                    </div>
                  )}

                  <div className="pt-1">
                    <Button
                      variant="primary"
                      onClick={handleInitializeSubscription}
                      disabled={initializeSubscriptionMutation.isPending || !selectedPlanId}
                    >
                      {initializeSubscriptionMutation.isPending ? 'Application du pack...' : 'Appliquer ce pack'}
                    </Button>
                    {!saasSettings?.allowAdditionalModulesOnCreate && (
                      <p className="text-xs text-amber-500 mt-2">Ajout de modules additionnels limite par la regle SaaS.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Modules */}
          <Card id="modules-section">
            <CardHeader>
              <CardTitle>Modules activés</CardTitle>
              <p className="text-sm text-text-muted mt-1">
                Activez ou désactivez les modules pour cette entreprise. Les modules actifs seront disponibles pour toutes ses agences.
              </p>
              {searchParams.get('section') === 'modules' && (
                <p className="text-xs text-primary mt-2">
                  Étape 3 : finalisez ici l&apos;activation des modules.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {!subscription ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                  Choisissez et appliquez un pack avant d activer les modules.
                </div>
              ) : modulesLoading ? (
                <LoadingState message="Chargement des modules..." />
              ) : (
                <div className="space-y-3">
                  {ALL_MODULES.map((mod) => {
                    const active = isModuleActive(mod.code);
                    const toggling = togglingModule === mod.code;
                    const requiredBy = requiredByActiveMap.get(mod.code) ?? [];
                    const lockDeactivation = active && requiredBy.length > 0;
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
                          {lockDeactivation && (
                            <p className="text-xs text-amber-500 mt-1">
                              Requis par: {requiredBy.map((c) => MODULE_LABELS[c] || c).join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleModule(mod.code)}
                          disabled={toggling || lockDeactivation}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                            active ? 'bg-primary' : 'bg-border'
                          } ${toggling || lockDeactivation ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                  <div className="pt-2 flex justify-end">
                    <Button variant="primary" onClick={() => router.push('/admin/companies')}>
                      Terminer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
