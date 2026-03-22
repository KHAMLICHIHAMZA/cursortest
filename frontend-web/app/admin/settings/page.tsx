'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import {
  saasSettingsApi,
  SaasSettingsAuditItem,
  UpdateSaasSettingsDto,
} from '@/lib/api/saas-settings';
import { toast } from '@/components/ui/toast';
import { moduleApi, ModuleCode } from '@/lib/api/module';
import { planApi, Plan } from '@/lib/api/plan';

const MODULE_LABELS: Record<ModuleCode, string> = {
  VEHICLES: 'Véhicules',
  BOOKINGS: 'Réservations',
  INVOICES: 'Facturation',
  MAINTENANCE: 'Maintenance',
  FINES: 'Amendes',
  ANALYTICS: 'Analytics',
  GPS: 'GPS',
  CONTRACTS: 'Contrats',
  JOURNAL: 'Journal',
  CHARGES: 'Charges',
  NOTIFICATIONS: 'Notifications',
};

const MODULE_CODES = Object.keys(MODULE_LABELS) as ModuleCode[];
type SettingsTab = 'global' | 'dependencies' | 'simulator' | 'history';

const SETTINGS_KEY_LABELS: Record<string, string> = {
  'saas.allow_additional_modules_on_create': 'Autoriser les modules additionnels à la création',
  'saas.allow_agency_overage_on_create': 'Autoriser le dépassement du quota agences à la création',
  'saas.extra_module_price_mad': 'Prix d’un module additionnel (MAD/mois)',
  'saas.extra_agency_price_mad': 'Prix d’une agence additionnelle (MAD/mois)',
  'saas.maintenance_mileage_alert_interval_km': 'Palier km des alertes maintenance automatiques',
};

function formatSettingsKeyLabel(key: string): string {
  return SETTINGS_KEY_LABELS[key] || key;
}

function formatAuditValue(rawValue: string): string {
  if (rawValue === 'true') return 'Oui';
  if (rawValue === 'false') return 'Non';
  return rawValue;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('global');
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ['saas-settings'],
    queryFn: () => saasSettingsApi.get(),
  });
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['plans', 'with-inactive'],
    queryFn: () => planApi.getAll(true),
  });
  const { data: dependencies = [] } = useQuery({
    queryKey: ['module-dependencies'],
    queryFn: () => moduleApi.getDependencies(),
  });
  const { data: auditItems = [] } = useQuery<SaasSettingsAuditItem[]>({
    queryKey: ['saas-settings-audit'],
    queryFn: () => saasSettingsApi.getAudit(),
  });

  const [form, setForm] = useState<UpdateSaasSettingsDto>({
    extraAgencyPriceMad: 0,
    extraModulePriceMad: 0,
    allowAgencyOverageOnCreate: true,
    allowAdditionalModulesOnCreate: true,
    maintenanceMileageAlertIntervalKm: 10000,
  });
  const [newDependency, setNewDependency] = useState<{
    moduleCode: ModuleCode;
    dependsOnCode: ModuleCode;
  }>({ moduleCode: 'BOOKINGS', dependsOnCode: 'VEHICLES' });
  const [simPlanId, setSimPlanId] = useState<string>('');
  const [simMaxAgencies, setSimMaxAgencies] = useState<string>('');
  const [simAdditionalModules, setSimAdditionalModules] = useState<ModuleCode[]>([]);
  const [historyKeyFilter, setHistoryKeyFilter] = useState<string>('');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  useEffect(() => {
    if (!settings) return;
    setForm({
      extraAgencyPriceMad: settings.extraAgencyPriceMad,
      extraModulePriceMad: settings.extraModulePriceMad,
      allowAgencyOverageOnCreate: settings.allowAgencyOverageOnCreate,
      allowAdditionalModulesOnCreate: settings.allowAdditionalModulesOnCreate,
      maintenanceMileageAlertIntervalKm: settings.maintenanceMileageAlertIntervalKm,
    });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSaasSettingsDto) => saasSettingsApi.update(payload),
    onSuccess: () => {
      toast.success('Paramètres SaaS mis à jour');
      queryClient.invalidateQueries({ queryKey: ['saas-settings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });
  const addDependencyMutation = useMutation({
    mutationFn: () => moduleApi.createDependency(newDependency),
    onSuccess: () => {
      toast.success('Dépendance ajoutée');
      void queryClient.invalidateQueries({ queryKey: ['module-dependencies'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erreur lors de l'ajout");
    },
  });
  const removeDependencyMutation = useMutation({
    mutationFn: ({ moduleCode, dependsOnCode }: { moduleCode: ModuleCode; dependsOnCode: ModuleCode }) =>
      moduleApi.deleteDependency(moduleCode, dependsOnCode),
    onSuccess: () => {
      toast.success('Dépendance supprimée');
      void queryClient.invalidateQueries({ queryKey: ['module-dependencies'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const simulationInput = useMemo(
    () => ({
      planId: simPlanId || undefined,
      maxAgencies: simMaxAgencies ? Number(simMaxAgencies) : undefined,
      additionalModuleCodes: simAdditionalModules,
    }),
    [simPlanId, simMaxAgencies, simAdditionalModules],
  );
  const simulationModulesKey = useMemo(
    () => [...simAdditionalModules].sort().join(','),
    [simAdditionalModules],
  );
  const { data: simulation, isFetching: simulationLoading } = useQuery({
    queryKey: ['saas-pricing-simulation', simPlanId || '', simMaxAgencies || '', simulationModulesKey],
    queryFn: () => saasSettingsApi.simulatePricing(simulationInput),
  });
  const filteredAuditItems = useMemo(() => {
    const keySearch = historyKeyFilter.trim().toLowerCase();
    const from = historyStartDate ? new Date(`${historyStartDate}T00:00:00`) : null;
    const to = historyEndDate ? new Date(`${historyEndDate}T23:59:59.999`) : null;
    return auditItems.filter((item) => {
      const keyMatch = !keySearch || item.key.toLowerCase().includes(keySearch);
      const updatedAt = new Date(item.updatedAt);
      const dateMatch = (!from || updatedAt >= from) && (!to || updatedAt <= to);
      return keyMatch && dateMatch;
    });
  }, [auditItems, historyKeyFilter, historyStartDate, historyEndDate]);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-5">
            <h1 className="text-2xl font-bold text-text">Paramètres SaaS</h1>
            <p className="text-sm text-text-muted mt-1">
              Réglages globaux de tarification SaaS.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Les règles par plan se gèrent dans{' '}
              <Link href="/admin/plans" className="text-primary hover:underline">
                Plans
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={activeTab === 'global' ? 'primary' : 'outline'} onClick={() => setActiveTab('global')}>
                Règles globales
              </Button>
              <Button
                variant={activeTab === 'dependencies' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('dependencies')}
              >
                Compatibilité modules
              </Button>
              <Button
                variant={activeTab === 'simulator' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('simulator')}
              >
                Estimer un prix
              </Button>
              <Button
                variant={activeTab === 'history' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('history')}
              >
                Journal des changements
              </Button>
            </div>
          </Card>

          {isLoading ? (
            <LoadingState message="Chargement des paramètres..." />
          ) : isError ? (
            <Card className="p-5">
              <p className="text-sm text-red-500">
                Impossible de charger les paramètres SaaS.
              </p>
              <div className="mt-3">
                <Button variant="outline" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {activeTab === 'global' && (
                <Card className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="extraAgencyPriceMad" className="block text-sm font-medium text-text mb-2">
                        Prix agence supplémentaire (MAD/mois)
                      </label>
                      <Input
                        id="extraAgencyPriceMad"
                        type="number"
                        min="0"
                        value={form.extraAgencyPriceMad ?? 0}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            extraAgencyPriceMad: Math.max(0, Number(e.target.value || 0)),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="extraModulePriceMad" className="block text-sm font-medium text-text mb-2">
                        Prix module supplémentaire (MAD/mois)
                      </label>
                      <Input
                        id="extraModulePriceMad"
                        type="number"
                        min="0"
                        value={form.extraModulePriceMad ?? 0}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            extraModulePriceMad: Math.max(0, Number(e.target.value || 0)),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="maintenanceMileageAlertIntervalKm"
                        className="block text-sm font-medium text-text mb-2"
                      >
                        Palier alerte maintenance (km)
                      </label>
                      <Input
                        id="maintenanceMileageAlertIntervalKm"
                        type="number"
                        min="1000"
                        step="500"
                        value={form.maintenanceMileageAlertIntervalKm ?? 10000}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            maintenanceMileageAlertIntervalKm: Math.max(
                              1000,
                              Math.floor(Number(e.target.value || 10000)),
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form.allowAgencyOverageOnCreate}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, allowAgencyOverageOnCreate: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text">
                        Autoriser le dépassement du quota agences à la création entreprise
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form.allowAdditionalModulesOnCreate}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, allowAdditionalModulesOnCreate: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text">
                        Autoriser l&apos;ajout de modules hors pack à la création entreprise
                      </span>
                    </label>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={() => updateMutation.mutate(form)}
                      isLoading={updateMutation.isPending}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </Card>
              )}

              {activeTab === 'dependencies' && (
                <div className="space-y-4">
                  <Card className="p-5 space-y-3">
                    <h3 className="text-lg font-semibold text-text">Ajouter une dépendance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select
                        className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                        value={newDependency.moduleCode}
                        onChange={(e) =>
                          setNewDependency((prev) => ({
                            ...prev,
                            moduleCode: e.target.value as ModuleCode,
                          }))
                        }
                      >
                        {MODULE_CODES.map((code) => (
                          <option key={code} value={code}>
                            {MODULE_LABELS[code]}
                          </option>
                        ))}
                      </select>
                      <select
                        className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                        value={newDependency.dependsOnCode}
                        onChange={(e) =>
                          setNewDependency((prev) => ({
                            ...prev,
                            dependsOnCode: e.target.value as ModuleCode,
                          }))
                        }
                      >
                        {MODULE_CODES.map((code) => (
                          <option key={code} value={code}>
                            {MODULE_LABELS[code]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      variant="primary"
                      isLoading={addDependencyMutation.isPending}
                      onClick={() => addDependencyMutation.mutate()}
                    >
                      Ajouter
                    </Button>
                  </Card>

                  <Card className="p-5">
                    <h3 className="text-lg font-semibold text-text mb-4">Matrice des dépendances</h3>
                    <div className="space-y-3">
                      {MODULE_CODES.map((moduleCode) => {
                        const requires = dependencies
                          .filter((dep: any) => dep.moduleCode === moduleCode)
                          .map((dep: any) => dep.dependsOnCode as ModuleCode);
                        const usedBy = dependencies
                          .filter((dep: any) => dep.dependsOnCode === moduleCode)
                          .map((dep: any) => dep.moduleCode as ModuleCode);

                        return (
                          <div key={moduleCode} className="border border-border rounded-md p-3">
                            <p className="font-medium text-text">{MODULE_LABELS[moduleCode]}</p>
                            <p className="text-xs text-text-muted mt-1">
                              Dépend de: {requires.length ? requires.map((m) => MODULE_LABELS[m]).join(', ') : 'Aucune'}
                            </p>
                            <p className="text-xs text-text-muted">
                              Impact si désactivé: {usedBy.length ? usedBy.map((m) => MODULE_LABELS[m]).join(', ') : 'Aucun'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {dependencies
                                .filter((dep: any) => dep.moduleCode === moduleCode)
                                .map((dep: any) => (
                                  <Button
                                    key={dep.id}
                                    variant="outline"
                                    onClick={() =>
                                      removeDependencyMutation.mutate({
                                        moduleCode: dep.moduleCode,
                                        dependsOnCode: dep.dependsOnCode,
                                      })
                                    }
                                  >
                                    Supprimer {MODULE_LABELS[dep.dependsOnCode as ModuleCode]}
                                  </Button>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'simulator' && (
                <Card className="p-5 space-y-4">
                  <h3 className="text-lg font-semibold text-text">Simulateur de tarification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text mb-2">Plan</label>
                      <select
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                        value={simPlanId}
                        onChange={(e) => setSimPlanId(e.target.value)}
                      >
                        <option value="">Aucun plan</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-text mb-2">Nombre agences cible</label>
                      <Input
                        type="number"
                        min="0"
                        value={simMaxAgencies}
                        onChange={(e) => setSimMaxAgencies(e.target.value)}
                        placeholder="Ex: 8"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text mb-2">Modules additionnels</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {MODULE_CODES.map((code) => (
                        <label key={code} className="flex items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={simAdditionalModules.includes(code)}
                            onChange={(e) =>
                              setSimAdditionalModules((prev) =>
                                e.target.checked ? [...prev, code] : prev.filter((c) => c !== code),
                              )
                            }
                          />
                          {MODULE_LABELS[code]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="border border-border rounded-md p-3">
                    {simulationLoading ? (
                      <p className="text-sm text-text-muted">Simulation en cours...</p>
                    ) : simulation ? (
                      <>
                        <p className="text-sm text-text">
                          Montant estimé: <strong>{simulation.monthlyAmount} MAD/mois</strong>
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Base plan: {simulation.breakdown.basePlanPrice} | Agences extra:{' '}
                          {simulation.breakdown.extraAgenciesCount} | Modules extra:{' '}
                          {simulation.breakdown.extraModules.length}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Sources: agence({simulation.appliedRules.source.extraAgencyPriceMad}) / module(
                          {simulation.appliedRules.source.extraModulePriceMad})
                        </p>
                        {simulation.validationErrors.length > 0 && (
                          <ul className="mt-2 text-xs text-red-500 space-y-1">
                            {simulation.validationErrors.map((err) => (
                              <li key={err}>- {err}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-text-muted">Aucune simulation</p>
                    )}
                  </div>
                </Card>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <Card className="p-5">
                    <h3 className="text-lg font-semibold text-text mb-3">Filtres d&apos;historique</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Clé règle globale</label>
                        <Input
                          value={historyKeyFilter}
                          onChange={(e) => setHistoryKeyFilter(e.target.value)}
                          placeholder="Ex: saas.extra_agency_price_mad"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Date début</label>
                        <Input
                          type="date"
                          value={historyStartDate}
                          onChange={(e) => setHistoryStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Date fin</label>
                        <Input
                          type="date"
                          value={historyEndDate}
                          onChange={(e) => setHistoryEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setHistoryKeyFilter('');
                          setHistoryStartDate('');
                          setHistoryEndDate('');
                        }}
                      >
                        Réinitialiser filtres
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h3 className="text-lg font-semibold text-text mb-3">Historique des règles globales</h3>
                    <div className="space-y-2">
                      {filteredAuditItems.length === 0 ? (
                        <p className="text-sm text-text-muted">Aucune donnée d&apos;historique.</p>
                      ) : (
                        filteredAuditItems.map((item) => (
                          <div key={item.id} className="border border-border rounded-md p-3">
                            <p className="text-sm font-medium text-text">{formatSettingsKeyLabel(item.key)}</p>
                            <p className="text-[11px] text-text-muted">{item.key}</p>
                            <p className="text-xs text-text-muted">
                              Valeur: <span className="text-text">{formatAuditValue(item.value)}</span> | Version: {item.version} |
                              Actif: {item.isActive ? 'Oui' : 'Non'}
                            </p>
                            <p className="text-xs text-text-muted">
                              Dernière mise à jour: {new Date(item.updatedAt).toLocaleString('fr-FR')}
                            </p>
                            {item.description && (
                              <p className="text-xs text-text-muted mt-1">{item.description}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                </div>
              )}
            </>
          )}
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

