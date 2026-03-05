'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { saasSettingsApi, UpdateSaasSettingsDto } from '@/lib/api/saas-settings';
import { toast } from '@/components/ui/toast';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['saas-settings'],
    queryFn: () => saasSettingsApi.get(),
  });

  const [form, setForm] = useState<UpdateSaasSettingsDto>({
    extraAgencyPriceMad: 0,
    extraModulePriceMad: 0,
    allowAgencyOverageOnCreate: true,
    allowAdditionalModulesOnCreate: true,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      extraAgencyPriceMad: settings.extraAgencyPriceMad,
      extraModulePriceMad: settings.extraModulePriceMad,
      allowAgencyOverageOnCreate: settings.allowAgencyOverageOnCreate,
      allowAdditionalModulesOnCreate: settings.allowAdditionalModulesOnCreate,
    });
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSaasSettingsDto) => saasSettingsApi.update(payload),
    onSuccess: () => {
      toast.success('Parametres SaaS mis a jour');
      queryClient.invalidateQueries({ queryKey: ['saas-settings'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise a jour');
    },
  });

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-5">
            <h1 className="text-2xl font-bold text-text">Parametres SaaS</h1>
            <p className="text-sm text-text-muted mt-1">
              Parametres globaux de tarification et regles appliquees a la creation des entreprises.
            </p>
            <p className="text-xs text-text-muted mt-2">
              Les regles definies au niveau d&apos;un plan restent prioritaires sur ces valeurs globales.
            </p>
          </Card>

          {isLoading ? (
            <LoadingState message="Chargement des parametres..." />
          ) : (
            <Card className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="extraAgencyPriceMad" className="block text-sm font-medium text-text mb-2">
                    Prix agence supplementaire (MAD/mois)
                  </label>
                  <Input
                    id="extraAgencyPriceMad"
                    type="number"
                    min="0"
                    value={form.extraAgencyPriceMad ?? 0}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, extraAgencyPriceMad: Math.max(0, Number(e.target.value || 0)) }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="extraModulePriceMad" className="block text-sm font-medium text-text mb-2">
                    Prix module supplementaire (MAD/mois)
                  </label>
                  <Input
                    id="extraModulePriceMad"
                    type="number"
                    min="0"
                    value={form.extraModulePriceMad ?? 0}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, extraModulePriceMad: Math.max(0, Number(e.target.value || 0)) }))
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
                    Autoriser le depassement du quota agences lors de la creation entreprise
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
                    Autoriser l ajout de modules hors pack lors de la creation entreprise
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
        </div>
      </MainLayout>
    </RouteGuard>
  );
}

