'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, UpdateCompanyDto } from '@/lib/api/company';
import { moduleApi, ModuleCode } from '@/lib/api/module';
import { planApi } from '@/lib/api/plan';
import { subscriptionApi } from '@/lib/api/subscription';
import { saasSettingsApi } from '@/lib/api/saas-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

type WorkflowSection = 'general' | 'pack' | 'subscription';

const WORKFLOW_STEPS: { key: WorkflowSection; title: string; helper: string }[] = [
  { key: 'general', title: 'Étape 1 - Entreprise', helper: 'Informations générales' },
  { key: 'pack', title: 'Étape 2 - Pack & agences', helper: 'Plan + capacité' },
  { key: 'subscription', title: 'Étape 3 - Modules & finalisation', helper: 'Détails + validation' },
];

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const sectionName = searchParams.get('section');
  const currentSection: WorkflowSection = (() => {
    if (sectionName === 'agencies') return 'pack';
    if (sectionName === 'pack' || sectionName === 'subscription') return sectionName;
    return 'general';
  })();

  const goToSection = useCallback((section: WorkflowSection) => {
    if (section === 'general') {
      router.replace(`/admin/companies/${id}`);
      return;
    }
    router.replace(`/admin/companies/${id}?section=${section}`);
  }, [router, id]);

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyApi.getById(id),
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [draftMaxAgencies, setDraftMaxAgencies] = useState<string>('');
  const [additionalModuleCodes, setAdditionalModuleCodes] = useState<ModuleCode[]>([]);
  const [packError, setPackError] = useState('');
  const [isFinalReviewMode, setIsFinalReviewMode] = useState(false);

  useEffect(() => {
    if (!company) return;
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
    if (draftMaxAgencies === '' && (company as any).maxAgencies != null) {
      setDraftMaxAgencies(String((company as any).maxAgencies));
    }
  }, [company, draftMaxAgencies]);

  useEffect(() => {
    if (!subscription) return;
    if (!selectedPlanId) {
      setSelectedPlanId(subscription.planId);
    }
  }, [subscription, selectedPlanId]);

  const resolvedPlanId = selectedPlanId || subscription?.planId || '';

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === resolvedPlanId) ?? null,
    [plans, resolvedPlanId],
  );

  const selectedPlanModuleCodes = useMemo(
    () => (selectedPlan ? selectedPlan.planModules.map((mod) => mod.moduleCode as ModuleCode) : []),
    [selectedPlan],
  );

  const selectablePlans = useMemo(
    () => plans.filter((plan) => plan.isActive || plan.id === resolvedPlanId),
    [plans, resolvedPlanId],
  );

  useEffect(() => {
    if (!subscription || !selectedPlan) return;
    if (additionalModuleCodes.length > 0) return;
    const existing = (subscription.subscriptionModules || [])
      .map((mod) => mod.moduleCode as ModuleCode)
      .filter((code) => !selectedPlanModuleCodes.includes(code));
    setAdditionalModuleCodes(Array.from(new Set(existing)));
  }, [subscription, selectedPlan, selectedPlanModuleCodes, additionalModuleCodes.length]);

  useEffect(() => {
    setAdditionalModuleCodes((prev) =>
      prev.filter((code) => !selectedPlanModuleCodes.includes(code)),
    );
  }, [selectedPlanModuleCodes]);

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
      const deps = getDependenciesRecursively(code).filter(
        (depCode) => !selectedPlanModuleCodes.includes(depCode),
      );
      deps.forEach((depCode) => next.add(depCode));
      return Array.from(next);
    });
  };

  const simulationInputMaxAgencies =
    draftMaxAgencies.trim() === '' ? undefined : Number(draftMaxAgencies);
  const { data: pricingSimulation } = useQuery({
    queryKey: [
      'saas-pricing-simulation',
      resolvedPlanId,
      simulationInputMaxAgencies ?? null,
      additionalModuleCodes.join(','),
    ],
    queryFn: () =>
      saasSettingsApi.simulatePricing({
        planId: resolvedPlanId || undefined,
        maxAgencies:
          simulationInputMaxAgencies !== undefined && Number.isFinite(simulationInputMaxAgencies)
            ? simulationInputMaxAgencies
            : undefined,
        additionalModuleCodes,
      }),
    enabled: !!resolvedPlanId,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (data: UpdateCompanyDto) => companyApi.update(id, data),
    onSuccess: () => {
      toast.success('Informations entreprise mises à jour');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      setErrors({ submit: message });
      toast.error(message);
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (payload: { planId: string; maxAgencies?: number; additionalModuleCodes?: string[] }) =>
      companyApi.updateSubscriptionConfig(id, payload),
    onSuccess: () => {
      toast.success('Abonnement mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['subscription-by-company', id] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      router.push('/admin/companies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Erreur lors de la mise à jour de l'abonnement";
      setPackError(Array.isArray(message) ? message.join(' | ') : message);
      toast.error(Array.isArray(message) ? message.join(' | ') : message);
    },
  });

  const handleSaveCompanyAndContinue = () => {
    setErrors({});
    const companyName = (formData.name || '').trim();
    if (!companyName) {
      setErrors({ name: 'Le nom est requis' });
      return;
    }
    updateCompanyMutation.mutate(formData, {
      onSuccess: () => goToSection('pack'),
    });
  };

  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCompanyAndContinue();
  };

  const parsedMaxAgencies =
    draftMaxAgencies.trim() === '' ? undefined : Number.parseInt(draftMaxAgencies, 10);
  const isDraftMaxAgenciesValid =
    draftMaxAgencies.trim() === '' ||
    (Number.isFinite(parsedMaxAgencies) && (parsedMaxAgencies as number) >= 0);

  const effectiveCompanyName = (formData.name || '').trim() || company?.name?.trim() || '';
  const canAccessPack = effectiveCompanyName.length > 0;
  const canAccessSubscription = canAccessPack && !!resolvedPlanId && isDraftMaxAgenciesValid;
  const sectionAccess: Record<WorkflowSection, boolean> = {
    general: true,
    pack: canAccessPack,
    subscription: canAccessSubscription,
  };
  const isCurrentSectionAccessible =
    currentSection === 'general' ||
    (currentSection === 'pack' && canAccessPack) ||
    (currentSection === 'subscription' && canAccessSubscription);

  useEffect(() => {
    if (isCurrentSectionAccessible) return;
    if (canAccessSubscription) {
      goToSection('subscription');
      return;
    }
    if (canAccessPack) {
      goToSection('pack');
      return;
    }
    goToSection('general');
  }, [isCurrentSectionAccessible, canAccessPack, canAccessSubscription, goToSection]);

  useEffect(() => {
    if (currentSection !== 'subscription') {
      setIsFinalReviewMode(false);
    }
  }, [currentSection]);

  const getSubscriptionPayload = () => {
    const maxAgencies = Number.isFinite(parsedMaxAgencies as number) ? parsedMaxAgencies : undefined;
    return {
      planId: resolvedPlanId,
      maxAgencies,
      additionalModuleCodes,
    };
  };

  const extraAgencyUnitPriceMad = pricingSimulation?.appliedRules.values.extraAgencyPriceMad ?? 0;
  const extraModuleUnitPriceMad = pricingSimulation?.appliedRules.values.extraModulePriceMad ?? 0;
  const simulatedExtraModules = pricingSimulation?.breakdown.extraModules ?? additionalModuleCodes;
  const estimatedDeltaMad = pricingSimulation
    ? pricingSimulation.monthlyAmount - pricingSimulation.breakdown.basePlanPrice
    : 0;

  const handleOpenFinalReview = () => {
    if (!resolvedPlanId) {
      setPackError("Choisissez un pack pour enregistrer l'abonnement.");
      return;
    }
    if (!isDraftMaxAgenciesValid) {
      setPackError("Le nombre max d'agences doit être un entier positif.");
      return;
    }
    setPackError('');
    setIsFinalReviewMode(true);
  };

  const handleConfirmSubscription = () => {
    if (!resolvedPlanId) {
      setPackError("Choisissez un pack pour enregistrer l'abonnement.");
      return;
    }
    if (!isDraftMaxAgenciesValid) {
      setPackError("Le nombre max d'agences doit être un entier positif.");
      return;
    }
    setPackError('');
    updateSubscriptionMutation.mutate({
      ...getSubscriptionPayload(),
    });
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

  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) => step.key === currentSection);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6 px-2 sm:px-0">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                {WORKFLOW_STEPS.map((step, index) => {
                  const isActive = step.key === currentSection;
                  const isDone = index < currentStepIndex && sectionAccess[step.key];
                  const canNavigate = sectionAccess[step.key] || index <= currentStepIndex;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => canNavigate && goToSection(step.key)}
                      disabled={!canNavigate}
                      className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/10'
                          : isDone
                            ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                            : canNavigate
                              ? 'border-border bg-card hover:border-primary/30'
                              : 'border-border/60 bg-card/60 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <p className="text-sm font-semibold text-text">{step.title}</p>
                      <p className="text-xs text-text-muted">{step.helper}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {currentSection === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>Étape 1 - Informations entreprise</CardTitle>
                <p className="text-sm text-text-muted mt-1">
                  Remplissez les informations de l&apos;entreprise puis passez à l&apos;étape suivante.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitStep1} className="space-y-6" noValidate>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                        Nom de l&apos;entreprise *
                      </label>
                      <Input
                        id="name"
                        value={formData.name || ''}
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
                        Identifiant légal (ICE)
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

                    <div>
                      <label htmlFor="bookingNumberMode" className="block text-sm font-medium text-text mb-2">
                        Mode N° réservation
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

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
                        Téléphone
                      </label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
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

                  <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-border">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={updateCompanyMutation.isPending}
                    >
                      {updateCompanyMutation.isPending
                        ? 'Validation...'
                        : 'Suivant'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {currentSection === 'pack' && (
            <Card>
              <CardHeader>
                <CardTitle>Étape 2 - Pack et capacité agences</CardTitle>
                <p className="text-sm text-text-muted mt-1">
                  Sélectionnez le pack et la capacité agences dans ce même écran.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionLoading ? (
                  <LoadingState message="Chargement de l'abonnement..." />
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Pack</label>
                      <select
                        value={resolvedPlanId}
                        onChange={(e) => {
                          setSelectedPlanId(e.target.value);
                          setPackError('');
                        }}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text"
                      >
                        <option value="">Choisir un pack</option>
                        {selectablePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price} MAD/mois{!plan.isActive ? ' (inactif)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPlan && (
                      <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                        <p>
                          Prix du pack: <span className="font-medium text-text">{selectedPlan.price} MAD/mois</span>
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
                            {selectedPlanModuleCodes.length > 0
                              ? selectedPlanModuleCodes.map((code) => MODULE_LABELS[code] || code).join(', ')
                              : 'Aucun'}
                          </span>
                        </p>
                        {subscription && (
                          <p className="text-xs text-text-muted">
                            Abonnement actuel: {subscription.plan?.name || '-'} ({subscription.amount} MAD/mois)
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Nombre max d&apos;agences
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={draftMaxAgencies}
                        onChange={(e) => {
                          setDraftMaxAgencies(e.target.value);
                          setPackError('');
                        }}
                        placeholder={
                          selectedPlanQuotaAgencies === -1
                            ? 'Illimité'
                            : selectedPlanQuotaAgencies !== undefined
                              ? String(selectedPlanQuotaAgencies)
                              : 'Laisser vide'
                        }
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Laissez vide pour reprendre la capacité incluse dans le pack.
                      </p>
                      {!isDraftMaxAgenciesValid && (
                        <p className="text-red-500 text-sm mt-1">
                          Le nombre max d&apos;agences doit être un entier positif.
                        </p>
                      )}
                    </div>

                    {pricingSimulation && (
                      <div className="rounded-lg border border-border p-3 text-sm space-y-1 bg-card/50">
                        <p className="text-xs uppercase tracking-wide text-text-muted">Calcul automatique en direct</p>
                        <p>
                          Montant total actuel:{' '}
                          <span className="font-semibold text-text">{pricingSimulation.monthlyAmount} MAD/mois</span>
                        </p>
                        <p>
                          Pack de base:{' '}
                          <span className="text-text">{pricingSimulation.breakdown.basePlanPrice} MAD/mois</span>
                        </p>
                        <p>
                          Surcoût actuel (agences + modules):{' '}
                          <span className="text-text">{estimatedDeltaMad} MAD/mois</span>
                        </p>
                        <p>
                          Détail agences: {pricingSimulation.breakdown.extraAgenciesCount} x {extraAgencyUnitPriceMad} MAD
                        </p>
                        <p>
                          Détail modules: {pricingSimulation.breakdown.extraModules.length} x {extraModuleUnitPriceMad} MAD
                        </p>
                        <p className="text-xs text-text-muted">
                          Ce montant se met à jour automatiquement dès que vous changez le pack, les agences ou les modules.
                        </p>
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => goToSection('general')}
                      >
                        Précédent
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          if (!resolvedPlanId) {
                            setPackError("Choisissez un pack pour passer à l'étape suivante.");
                            return;
                          }
                          if (!isDraftMaxAgenciesValid) {
                            setPackError("Le nombre max d'agences doit être un entier positif.");
                            return;
                          }
                          goToSection('subscription');
                        }}
                      >
                        Suivant
                      </Button>
                    </div>
                    {packError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                        {packError}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {currentSection === 'subscription' && (
            <Card>
              <CardHeader>
                <CardTitle>Étape 3 - Modules additionnels et validation</CardTitle>
                <p className="text-sm text-text-muted mt-1">
                  Ajoutez ou retirez les modules additionnels, puis vérifiez le récapitulatif avant validation finale.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!resolvedPlanId ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                    Sélectionnez d&apos;abord un pack à l&apos;étape 2.
                  </div>
                ) : isFinalReviewMode ? (
                  <>
                    <div className="rounded-lg border border-border p-4 space-y-4">
                      <h3 className="text-base font-semibold text-text">Récapitulatif final (lecture seule)</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Nom de l&apos;entreprise</label>
                          <Input value={effectiveCompanyName || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Raison sociale</label>
                          <Input value={formData.raisonSociale || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Identifiant légal</label>
                          <Input value={formData.identifiantLegal || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Forme juridique</label>
                          <Input value={formData.formeJuridique || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Mode N° réservation</label>
                          <Input value={formData.bookingNumberMode || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Téléphone</label>
                          <Input value={formData.phone || '-'} readOnly />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs text-text-muted mb-1">Adresse</label>
                          <Input value={formData.address || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Entreprise active</label>
                          <Input value={formData.isActive ? 'Oui' : 'Non'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Pack sélectionné</label>
                          <Input value={selectedPlan?.name || '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Prix du pack</label>
                          <Input value={selectedPlan ? `${selectedPlan.price} MAD/mois` : '-'} readOnly />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Capacité agences</label>
                          <Input
                            value={
                              draftMaxAgencies.trim() !== ''
                                ? draftMaxAgencies
                                : selectedPlanQuotaAgencies === -1
                                  ? 'Illimité'
                                  : selectedPlanQuotaAgencies !== undefined
                                    ? String(selectedPlanQuotaAgencies)
                                    : '-'
                            }
                            readOnly
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs text-text-muted mb-1">Modules additionnels</label>
                          <Input
                            value={
                              additionalModuleCodes.length > 0
                                ? additionalModuleCodes.map((code) => MODULE_LABELS[code] || code).join(', ')
                                : 'Aucun'
                            }
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                        <p>
                          Montant estimé:{' '}
                          <span className="font-semibold text-text">
                            {pricingSimulation ? `${pricingSimulation.monthlyAmount} MAD/mois` : 'N/A'}
                          </span>
                        </p>
                        <p>
                          Pack de base:{' '}
                          <span className="text-text">{pricingSimulation?.breakdown.basePlanPrice ?? '-'} MAD/mois</span>
                        </p>
                        <p>
                          Surcoût actuel (agences + modules):{' '}
                          <span className="text-text">{estimatedDeltaMad} MAD/mois</span>
                        </p>
                        {pricingSimulation && (
                          <>
                            <p>
                              Agences supplémentaires facturées:{' '}
                              <span className="text-text">{pricingSimulation.breakdown.extraAgenciesCount}</span>
                            </p>
                            <p>
                              Détail agences: {pricingSimulation.breakdown.extraAgenciesCount} x {extraAgencyUnitPriceMad} MAD
                            </p>
                            <p>
                              Détail modules: {pricingSimulation.breakdown.extraModules.length} x {extraModuleUnitPriceMad} MAD
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {packError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                        {packError}
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setIsFinalReviewMode(false)}
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        Retour modification
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleConfirmSubscription}
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        {updateSubscriptionMutation.isPending
                          ? 'Validation finale...'
                          : 'Valider'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-text">Modules additionnels</p>
                        <p className="text-xs text-text-muted mt-1">
                          Cliquez sur <span className="font-medium">Ajouter</span> pour activer un module.
                          Le prix unitaire appliqué par module est de{' '}
                          <span className="font-medium">{extraModuleUnitPriceMad} MAD/mois</span>.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {additionalModuleCandidates.map((code) => {
                          const checked = additionalModuleCodes.includes(code);
                          const lockedByDependents = hasSelectedDependents(code, additionalModuleCodes);
                          const deps = dependencyMap.get(code) ?? [];
                          return (
                            <div
                              key={code}
                              className={`rounded-lg border p-3 ${
                                checked ? 'border-primary bg-primary/5' : 'border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-text">{MODULE_LABELS[code] || code}</p>
                                  <p className="text-xs text-text-muted mt-1">
                                    {ALL_MODULES.find((m) => m.code === code)?.description || 'Module additionnel'}
                                  </p>
                                  <p className="text-xs text-text-muted mt-1">
                                    Impact: +{extraModuleUnitPriceMad} MAD/mois
                                  </p>
                                  {deps.length > 0 && (
                                    <p className="text-xs text-text-muted mt-1">
                                      Dépendances auto-ajoutées: {deps.map((d) => MODULE_LABELS[d] || d).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={checked ? 'secondary' : 'primary'}
                                  onClick={() => toggleAdditionalModule(code)}
                                  disabled={lockedByDependents}
                                  title={
                                    lockedByDependents
                                      ? 'Impossible de retirer: requis par un autre module sélectionné'
                                      : undefined
                                  }
                                >
                                  {checked ? 'Retirer' : 'Ajouter'}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {pricingSimulation && (
                      <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                        <p className="text-xs uppercase tracking-wide text-text-muted">Calcul automatique en direct</p>
                        <p>
                          Montant estimé:{' '}
                          <span className="font-semibold text-text">
                            {pricingSimulation.monthlyAmount} MAD/mois
                          </span>
                        </p>
                        <p>
                          Pack de base:{' '}
                          <span className="text-text">{pricingSimulation.breakdown.basePlanPrice} MAD/mois</span>
                        </p>
                        <p>
                          Surcoût actuel (agences + modules):{' '}
                          <span className="text-text">{estimatedDeltaMad} MAD/mois</span>
                        </p>
                        <p>
                          Agences supplémentaires facturées:{' '}
                          <span className="text-text">{pricingSimulation.breakdown.extraAgenciesCount}</span>
                        </p>
                        <p>
                          Détail agences: {pricingSimulation.breakdown.extraAgenciesCount} x {extraAgencyUnitPriceMad} MAD
                        </p>
                        <p>
                          Détail modules: {pricingSimulation.breakdown.extraModules.length} x {extraModuleUnitPriceMad} MAD
                        </p>
                        {simulatedExtraModules.length > 0 && (
                          <p>
                            Modules facturés:{' '}
                            <span className="text-text">
                              {simulatedExtraModules.map((code) => MODULE_LABELS[code] || code).join(', ')}
                            </span>
                          </p>
                        )}
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

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => goToSection('pack')}
                      >
                        Précédent
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleOpenFinalReview}
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        Voir le récapitulatif final
                      </Button>
                    </div>
                    {!saasSettings?.allowAdditionalModulesOnCreate && (
                      <p className="text-xs text-amber-500">
                        L&apos;ajout de modules additionnels est limité par la règle SaaS globale.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </RouteGuard>
  );
}
