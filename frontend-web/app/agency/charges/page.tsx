'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chargeApi, Charge, ChargeCategory, CreateChargeDto, CATEGORY_LABELS, CATEGORY_OPTIONS } from '@/lib/api/charge';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { authApi } from '@/lib/api/auth';
import Cookies from 'js-cookie';

const CATEGORY_COLORS: Record<string, string> = {
  BANK_INSTALLMENT: '#8B5CF6',
  INSURANCE: '#3B82F6',
  VIGNETTE: '#F59E0B',
  FUEL: '#EF4444',
  PREVENTIVE_MAINTENANCE: '#10B981',
  CORRECTIVE_MAINTENANCE: '#F97316',
  EXCEPTIONAL: '#EC4899',
  OTHER: '#6B7280',
};

const RECURRENCE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  YEARLY: 'Annuel',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
}

export default function ChargesPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const agencyId = user?.agencyIds?.[0] || '';

  // Filters
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);

  // Form state
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formCategory, setFormCategory] = useState<ChargeCategory>('BANK_INSTALLMENT');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRecurring, setFormRecurring] = useState(false);
  const [formRecurrencePeriod, setFormRecurrencePeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');

  // Queries
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', agencyId],
    queryFn: () => vehicleApi.getAll(agencyId || undefined),
    enabled: !!agencyId,
  });

  const filters = useMemo(() => ({
    agencyId: agencyId || undefined,
    vehicleId: filterVehicle || undefined,
    category: (filterCategory as ChargeCategory) || undefined,
    startDate: filterDateFrom || undefined,
    endDate: filterDateTo || undefined,
  }), [agencyId, filterVehicle, filterCategory, filterDateFrom, filterDateTo]);

  const { data: charges, isLoading } = useQuery<Charge[]>({
    queryKey: ['charges', filters],
    queryFn: () => chargeApi.getAll(filters),
    enabled: !!agencyId,
  });

  const allCharges = charges ?? [];

  // Summary stats
  const summary = useMemo(() => {
    const total = allCharges.reduce((sum, c) => sum + Number(c.amount), 0);
    const byCategory: Record<string, number> = {};
    allCharges.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + Number(c.amount);
    });
    return { total, byCategory, count: allCharges.length };
  }, [allCharges]);

  // Vehicle lookup
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles?.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicleMap.get(vehicleId);
    return v ? `${v.brand} ${v.model} - ${v.registrationNumber}` : vehicleId.slice(0, 8);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateChargeDto) => chargeApi.create(data),
    onSuccess: () => {
      toast.success('Charge ajoutee avec succes');
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erreur lors de la creation');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateChargeDto> }) => chargeApi.update(id, data),
    onSuccess: () => {
      toast.success('Charge modifiee');
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chargeApi.delete(id),
    onSuccess: () => {
      toast.success('Charge supprimee');
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  // Modal helpers
  const openNewModal = () => {
    setEditingCharge(null);
    setFormVehicleId(filterVehicle || '');
    setFormCategory('BANK_INSTALLMENT');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormRecurring(false);
    setFormRecurrencePeriod('MONTHLY');
    setShowModal(true);
  };

  const openEditModal = (charge: Charge) => {
    setEditingCharge(charge);
    setFormVehicleId(charge.vehicleId);
    setFormCategory(charge.category);
    setFormDescription(charge.description);
    setFormAmount(String(charge.amount));
    setFormDate(new Date(charge.date).toISOString().slice(0, 10));
    setFormRecurring(charge.recurring);
    setFormRecurrencePeriod((charge.recurrencePeriod as any) || 'MONTHLY');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCharge(null);
  };

  const handleSubmit = () => {
    if (!formVehicleId || !formAmount || !formDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const data: CreateChargeDto = {
      agencyId,
      vehicleId: formVehicleId,
      category: formCategory,
      description: formDescription,
      amount: parseFloat(formAmount),
      date: formDate,
      recurring: formRecurring,
      recurrencePeriod: formRecurring ? formRecurrencePeriod : undefined,
    };

    if (editingCharge) {
      updateMutation.mutate({ id: editingCharge.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (charge: Charge) => {
    if (confirm(`Supprimer cette charge de ${formatAmount(Number(charge.amount))} ?`)) {
      deleteMutation.mutate(charge.id);
    }
  };

  const hasFilters = filterVehicle || filterCategory || filterDateFrom || filterDateTo;

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text mb-1">Charges & Depenses</h1>
              <p className="text-text-muted text-sm">
                Gerez toutes les depenses de vos vehicules : mensualites, assurance, vignette, maintenance, carburant...
              </p>
            </div>
            <button
              onClick={openNewModal}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg"
            >
              + Nouvelle charge
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow">
              <p className="text-xs text-text-muted font-medium">Total charges</p>
              <p className="text-xl font-bold text-text mt-1">{formatAmount(summary.total)}</p>
              <p className="text-xs text-text-muted">{summary.count} charge(s)</p>
            </div>
            {Object.entries(summary.byCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([cat, amount]) => (
                <div key={cat} className="rounded-xl border border-border bg-card p-4 shadow">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] || '#6B7280' }} />
                    <p className="text-xs text-text-muted font-medium truncate">{CATEGORY_LABELS[cat as ChargeCategory] || cat}</p>
                  </div>
                  <p className="text-xl font-bold text-text mt-1">{formatAmount(amount)}</p>
                </div>
              ))}
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px] max-w-xs">
                <label className="block text-xs font-medium text-text mb-1">Vehicule</label>
                <select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">Tous les vehicules</option>
                  {vehicles?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} - {v.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[180px]">
                <label className="block text-xs font-medium text-text mb-1">Categorie</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">Toutes</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-text mb-1">Du</label>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm" />
              </div>
              <div className="min-w-[140px]">
                <label className="block text-xs font-medium text-text mb-1">Au</label>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm" />
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setFilterVehicle(''); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Reinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="text-center py-12 text-text-muted">Chargement...</div>
            ) : allCharges.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                Aucune charge enregistree.
                <button onClick={openNewModal} className="text-primary hover:underline ml-1">
                  Ajouter une charge
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th className="text-left py-3 px-4 font-medium text-text-muted">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-text-muted">Vehicule</th>
                      <th className="text-left py-3 px-4 font-medium text-text-muted">Categorie</th>
                      <th className="text-left py-3 px-4 font-medium text-text-muted">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">Montant</th>
                      <th className="text-left py-3 px-4 font-medium text-text-muted">Recurrence</th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCharges.map((charge) => {
                      const color = CATEGORY_COLORS[charge.category] || '#6B7280';
                      return (
                        <tr key={charge.id} className="border-b border-border/50 hover:bg-background/30 transition-colors">
                          <td className="py-3 px-4 text-text">{formatDate(charge.date)}</td>
                          <td className="py-3 px-4 text-text font-medium">
                            {charge.vehicle
                              ? `${charge.vehicle.brand} ${charge.vehicle.model} - ${charge.vehicle.registrationNumber}`
                              : getVehicleLabel(charge.vehicleId)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${color}20`, color }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                              {CATEGORY_LABELS[charge.category] || charge.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-muted max-w-[200px] truncate">{charge.description || '-'}</td>
                          <td className="py-3 px-4 text-right font-semibold text-text">{formatAmount(Number(charge.amount))}</td>
                          <td className="py-3 px-4 text-text-muted">
                            {charge.recurring ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {RECURRENCE_LABELS[charge.recurrencePeriod || ''] || charge.recurrencePeriod || 'Oui'}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(charge)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text hover:bg-background transition-colors"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(charge)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">
                  {editingCharge ? 'Modifier la charge' : 'Nouvelle charge'}
                </h3>
                <button onClick={closeModal} className="text-text-muted hover:text-text text-xl">&times;</button>
              </div>

              <div className="space-y-4">
                {/* Vehicule */}
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Vehicule *</label>
                  <select
                    value={formVehicleId}
                    onChange={(e) => setFormVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                  >
                    <option value="">Selectionner un vehicule</option>
                    {vehicles?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} - {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categorie */}
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Categorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ChargeCategory)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Description</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Mensualite janvier 2026"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                  />
                </div>

                {/* Montant + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Montant (MAD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Date *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                    />
                  </div>
                </div>

                {/* Recurrence */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={formRecurring}
                      onChange={(e) => setFormRecurring(e.target.checked)}
                      className="rounded border-border"
                    />
                    <label htmlFor="recurring" className="text-sm text-text">Charge recurrente</label>
                  </div>
                  {formRecurring && (
                    <select
                      value={formRecurrencePeriod}
                      onChange={(e) => setFormRecurrencePeriod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                    >
                      <option value="MONTHLY">Mensuel</option>
                      <option value="QUARTERLY">Trimestriel</option>
                      <option value="YEARLY">Annuel</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-background transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Enregistrement...'
                    : editingCharge ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </RouteGuard>
  );
}
