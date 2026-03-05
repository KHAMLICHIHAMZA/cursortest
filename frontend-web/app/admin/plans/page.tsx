'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { planApi, Plan } from '@/lib/api/plan';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

const ALL_MODULES = [
  { code: 'VEHICLES', label: 'Véhicules', desc: 'Gestion du parc automobile' },
  { code: 'BOOKINGS', label: 'Réservations', desc: 'Locations et planning' },
  { code: 'INVOICES', label: 'Facturation', desc: 'Factures et PDF' },
  { code: 'MAINTENANCE', label: 'Maintenance', desc: 'Entretien et réparations' },
  { code: 'FINES', label: 'Amendes', desc: 'Gestion des infractions' },
  { code: 'ANALYTICS', label: 'Analytics', desc: 'KPI et tableaux de bord' },
  { code: 'GPS', label: 'GPS', desc: 'Geolocalisation et tracking' },
  { code: 'CONTRACTS', label: 'Contrats', desc: 'Gestion des contrats de location' },
  { code: 'JOURNAL', label: 'Journal', desc: 'Historique et journal d activite' },
  { code: 'CHARGES', label: 'Charges', desc: 'Charges et depenses operationnelles' },
  { code: 'NOTIFICATIONS', label: 'Notifications', desc: 'Centre de notifications applicatives' },
];

const QUOTA_KEYS = [
  { key: 'agencies', label: 'Max agences' },
  { key: 'users', label: 'Max utilisateurs' },
  { key: 'vehicles', label: 'Max véhicules' },
];

function getQuotaValue(plan: Plan, key: string): number {
  const q = plan.planQuotas?.find((quota) => quota.quotaKey === key);
  return q?.quotaValue ?? -1;
}

function formatQuotaValue(value: number): string {
  return value === -1 ? 'Illimité' : String(value);
}

function formatQuotasDisplay(plan: Plan): string {
  const parts = QUOTA_KEYS.map(({ key, label }) => {
    const v = getQuotaValue(plan, key);
    const str = v === -1 ? 'Illimité' : String(v);
    const short = key === 'agencies' ? 'agences' : key === 'users' ? 'users' : 'véhicules';
    return `${str} ${short}`;
  });
  return parts.join(', ');
}

function formatPricingRulesDisplay(plan: Plan): string {
  const rule = plan.pricingRule;
  if (!rule) return 'Global SaaS';
  return `${rule.extraAgencyPriceMad} MAD/agence, ${rule.extraModulePriceMad} MAD/module`;
}

export default function PlansAdminPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans', 'all'],
    queryFn: () => planApi.getAll(true),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof planApi.create>[0]) => planApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setShowDialog(false);
      toast.success('Plan créé avec succès');
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof planApi.update>[1] }) =>
      planApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setEditingPlan(null);
      toast.success('Plan mis à jour avec succès');
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan supprimé avec succès');
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la suppression');
    },
  });

  const isDialogOpen = showDialog || !!editingPlan;
  const isEdit = !!editingPlan;

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingPlan(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get('name') as string)?.trim();
    if (!name) {
      toast.error('Le nom du plan est requis');
      return;
    }
    const description = (formData.get('description') as string)?.trim() || undefined;
    const priceRaw = formData.get('price') as string;
    const price = priceRaw ? parseFloat(priceRaw) : NaN;
    if (Number.isNaN(price) || price < 0) {
      toast.error('Le prix mensuel est requis et doit être un nombre positif');
      return;
    }

    const selectedModules = ALL_MODULES.filter((m) => formData.get(`module-${m.code}`) === 'on').map(
      (m) => m.code
    );
    const extraAgencyPriceMadRaw = formData.get('pricing-extraAgencyPriceMad') as string;
    const extraModulePriceMadRaw = formData.get('pricing-extraModulePriceMad') as string;
    const extraAgencyPriceMad = extraAgencyPriceMadRaw ? parseFloat(extraAgencyPriceMadRaw) : 0;
    const extraModulePriceMad = extraModulePriceMadRaw ? parseFloat(extraModulePriceMadRaw) : 0;
    if (Number.isNaN(extraAgencyPriceMad) || extraAgencyPriceMad < 0) {
      toast.error('Le prix agence supplementaire doit etre un nombre positif');
      return;
    }
    if (Number.isNaN(extraModulePriceMad) || extraModulePriceMad < 0) {
      toast.error('Le prix module supplementaire doit etre un nombre positif');
      return;
    }
    const pricingRules = {
      extraAgencyPriceMad,
      extraModulePriceMad,
      allowAgencyOverageOnCreate: formData.get('pricing-allowAgencyOverageOnCreate') === 'on',
      allowAdditionalModulesOnCreate: formData.get('pricing-allowAdditionalModulesOnCreate') === 'on',
    };

    const quotas: Record<string, number> = {};
    for (const { key } of QUOTA_KEYS) {
      const raw = formData.get(`quota-${key}`) as string;
      const val = raw === '' || raw === undefined ? -1 : parseInt(raw, 10);
      quotas[key] = Number.isNaN(val) ? -1 : val;
    }

    if (isEdit && editingPlan) {
      updateMutation.mutate({
        id: editingPlan.id,
        data: {
          name,
          description,
          price,
          moduleCodes: selectedModules,
          quotas,
          pricingRules,
          isActive: formData.get('isActive') === 'on',
        },
      });
    } else {
      createMutation.mutate({
        name,
        description,
        price,
        moduleCodes: selectedModules,
        quotas,
        pricingRules,
      });
    }
  };

  const handleDelete = (plan: Plan) => {
    if (!confirm(`Supprimer le plan « ${plan.name } » ? Cette action est irréversible.`)) return;
    deleteMutation.mutate(plan.id);
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <MainLayout>
          <div className="text-center py-8">Chargement...</div>
        </MainLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Gestion des Plans</h1>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau plan
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix (MAD/mois)</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Quotas</TableHead>
                  <TableHead>Surcharges</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun plan trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(plan.planModules ?? []).map((pm) => (
                            <Badge key={pm.moduleCode} variant="outline" size="sm">
                              {pm.moduleCode}
                            </Badge>
                          ))}
                          {(plan.planModules?.length ?? 0) === 0 && (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatQuotasDisplay(plan)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPricingRulesDisplay(plan)}
                      </TableCell>
                      <TableCell>
                        <Badge status={plan.isActive ? 'success' : 'inactive'}>
                          {plan.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPlan(plan)}
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Create / Edit dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEdit ? 'Modifier le plan' : 'Nouveau plan'}</DialogTitle>
            </DialogHeader>
            <form key={editingPlan?.id ?? 'new'} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du plan *</label>
                <Input
                  name="name"
                  required
                  defaultValue={editingPlan?.name}
                  placeholder="Ex: Starter, Pro, Enterprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <Input
                  name="description"
                  defaultValue={editingPlan?.description ?? ''}
                  placeholder="Courte description du plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Prix mensuel (MAD) *</label>
                <Input
                  type="number"
                  name="price"
                  required
                  min={0}
                  step={0.01}
                  defaultValue={editingPlan?.price ?? ''}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Modules inclus</label>
                <Card className="p-3 space-y-2">
                  {ALL_MODULES.map((m) => (
                    <label key={m.code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`module-${m.code}`}
                        defaultChecked={editingPlan?.planModules?.some((pm) => pm.moduleCode === m.code)}
                        className="rounded border-input"
                      />
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground text-sm">— {m.desc}</span>
                    </label>
                  ))}
                </Card>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quotas</label>
                <p className="text-xs text-muted-foreground mb-2">Mettre -1 pour illimité.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {QUOTA_KEYS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1">{label}</label>
                      <Input
                        type="number"
                        name={`quota-${key}`}
                        min={-1}
                        placeholder="Illimité (-1)"
                        defaultValue={
                          editingPlan
                            ? getQuotaValue(editingPlan, key)
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Règles tarifaires du plan</label>
                <Card className="p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Prix agence supp. (MAD/mois)</label>
                      <Input
                        type="number"
                        name="pricing-extraAgencyPriceMad"
                        min={0}
                        step={0.01}
                        defaultValue={editingPlan?.pricingRule?.extraAgencyPriceMad ?? 0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Prix module supp. (MAD/mois)</label>
                      <Input
                        type="number"
                        name="pricing-extraModulePriceMad"
                        min={0}
                        step={0.01}
                        defaultValue={editingPlan?.pricingRule?.extraModulePriceMad ?? 0}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="pricing-allowAgencyOverageOnCreate"
                      defaultChecked={editingPlan?.pricingRule?.allowAgencyOverageOnCreate ?? true}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Autoriser dépassement quota agences à la création</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="pricing-allowAdditionalModulesOnCreate"
                      defaultChecked={editingPlan?.pricingRule?.allowAdditionalModulesOnCreate ?? true}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Autoriser modules additionnels à la création</span>
                  </label>
                </Card>
              </div>

              {isEdit && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingPlan?.isActive ?? true}
                      className="rounded border-input"
                    />
                    <span className="text-sm font-medium">Plan actif</span>
                  </label>
                </div>
              )}

              {(createMutation.isError || updateMutation.isError) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {(createMutation.error || updateMutation.error) instanceof Error
                    ? (createMutation.error || updateMutation.error)?.message
                    : 'Une erreur est survenue'}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseDialog}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Enregistrement...'
                    : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </RouteGuard>
  );
}
