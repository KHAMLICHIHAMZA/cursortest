'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  chargeApi,
  Charge,
  ChargeCategory,
  ChargeScope,
  CostCenter,
  CreateChargeDto,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  COST_CENTER_OPTIONS,
  COST_CENTER_LABELS,
} from '@/lib/api/charge';
import { vehicleApi, Vehicle } from '@/lib/api/vehicle';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';
import { authApi } from '@/lib/api/auth';
import { agencyApi } from '@/lib/api/agency';
import { Select } from '@/components/ui/select';
import Cookies from 'js-cookie';

const CATEGORY_COLORS: Record<string, string> = {
  BANK_INSTALLMENT: '#8B5CF6',
  INSURANCE: '#3B82F6',
  GENERAL_INSURANCE: '#2563EB',
  VIGNETTE: '#F59E0B',
  FUEL: '#EF4444',
  PREVENTIVE_MAINTENANCE: '#10B981',
  CORRECTIVE_MAINTENANCE: '#F97316',
  SALARY: '#0EA5E9',
  OFFICE_RENT: '#6366F1',
  TAX: '#14B8A6',
  ADMIN_EXPENSE: '#475569',
  MARKETING_EXPENSE: '#A855F7',
  UTILITIES_EXPENSE: '#06B6D4',
  EXTERNAL_SERVICE: '#F43F5E',
  EXCEPTIONAL: '#EC4899',
  OTHER: '#6B7280',
};

const RECURRENCE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  YEARLY: 'Annuel',
};

const SCOPE_LABELS: Record<ChargeScope, string> = {
  VEHICLE: 'Véhicule',
  AGENCY: 'Agence',
  COMPANY: 'Société',
};

const NON_VEHICLE_CATEGORY_OPTIONS: ChargeCategory[] = [
  'GENERAL_INSURANCE',
  'SALARY',
  'OFFICE_RENT',
  'TAX',
  'ADMIN_EXPENSE',
  'MARKETING_EXPENSE',
  'UTILITIES_EXPENSE',
  'EXTERNAL_SERVICE',
  'EXCEPTIONAL',
  'OTHER',
];

const VEHICLE_CATEGORY_OPTIONS: ChargeCategory[] = [
  'BANK_INSTALLMENT',
  'INSURANCE',
  'VIGNETTE',
  'FUEL',
  'PREVENTIVE_MAINTENANCE',
  'CORRECTIVE_MAINTENANCE',
  'EXCEPTIONAL',
  'OTHER',
];

const RECURRENCE_OPTIONS = [
  { value: 'NONE', label: 'Ponctuelle' },
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'QUARTERLY', label: 'Trimestriel' },
  { value: 'YEARLY', label: 'Annuel' },
] as const;

const COST_CENTER_CATEGORY_MAP: Record<CostCenter, ChargeCategory[]> = {
  SALAIRES: ['SALARY'],
  LOYER_BUREAU: ['OFFICE_RENT'],
  ADMINISTRATIF: ['ADMIN_EXPENSE'],
  MARKETING: ['MARKETING_EXPENSE'],
  UTILITIES: ['UTILITIES_EXPENSE'],
  SERVICES_EXTERNES: ['EXTERNAL_SERVICE'],
  ASSURANCES_GENERALES: ['GENERAL_INSURANCE'],
  FISCALITE: ['TAX'],
  AUTRE: ['EXCEPTIONAL', 'OTHER'],
};

function getAllowedCategories(scope: ChargeScope, costCenter?: CostCenter): ChargeCategory[] {
  if (scope === 'VEHICLE') {
    return VEHICLE_CATEGORY_OPTIONS;
  }
  if (!costCenter) {
    return NON_VEHICLE_CATEGORY_OPTIONS;
  }
  return COST_CENTER_CATEGORY_MAP[costCenter] || NON_VEHICLE_CATEGORY_OPTIONS;
}

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

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes('"') || str.includes(';') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ChargesPage() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    enabled: !!Cookies.get('accessToken'),
  });

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const defaultAgencyId = user?.agencyIds?.[0] || '';
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const agencyId = selectedAgencyId || defaultAgencyId;

  // Fetch agencies for COMPANY_ADMIN
  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agencyApi.getAll(),
    enabled: isCompanyAdmin && !defaultAgencyId,
  });

  const companyAgencies = useMemo(
    () =>
      (agencies?.filter(
        (a: any) => !user?.companyId || a.companyId === user.companyId,
      ) || []),
    [agencies, user?.companyId],
  );

  // Auto-select first agency for COMPANY_ADMIN with no agencyIds
  useEffect(() => {
    if (isCompanyAdmin && !defaultAgencyId && !selectedAgencyId && companyAgencies.length > 0) {
      setSelectedAgencyId(companyAgencies[0].id);
    }
  }, [isCompanyAdmin, defaultAgencyId, selectedAgencyId, companyAgencies]);

  // Filters
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRecurrence, setFilterRecurrence] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [deletingCharge, setDeletingCharge] = useState<Charge | null>(null);

  // Form state
  const [formVehicleId, setFormVehicleId] = useState('');
  const [formScope, setFormScope] = useState<ChargeScope>('VEHICLE');
  const [formCostCenter, setFormCostCenter] = useState<CostCenter>('AUTRE');
  const [formCategory, setFormCategory] = useState<ChargeCategory>('BANK_INSTALLMENT');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRecurrencePeriod, setFormRecurrencePeriod] = useState<'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('NONE');

  // Queries
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', agencyId],
    queryFn: () => vehicleApi.getAll(agencyId || undefined),
    enabled: !!agencyId,
  });

  const filters = useMemo(() => ({
    agencyId: agencyId || undefined,
    vehicleId: filterVehicle || undefined,
    scope: (filterScope as ChargeScope) || undefined,
    costCenter: (filterCostCenter as CostCenter) || undefined,
    category: (filterCategory as ChargeCategory) || undefined,
    startDate: filterDateFrom || undefined,
    endDate: filterDateTo || undefined,
  }), [agencyId, filterVehicle, filterScope, filterCostCenter, filterCategory, filterDateFrom, filterDateTo]);

  const { data: charges, isLoading } = useQuery<Charge[]>({
    queryKey: ['charges', filters],
    queryFn: () => chargeApi.getAll(filters),
    enabled: !!agencyId,
  });

  const allChargesRaw = useMemo(() => charges ?? [], [charges]);

  const formCategoryOptions = useMemo(() => {
    const allowed = getAllowedCategories(formScope, formCostCenter);
    return CATEGORY_OPTIONS.filter((opt) => allowed.includes(opt.value));
  }, [formScope, formCostCenter]);

  const filterCategoryOptions = useMemo(() => {
    if (!filterScope) return [];
    const scopeForFilter = filterScope as ChargeScope;
    const costCenterForFilter = scopeForFilter === 'VEHICLE'
      ? undefined
      : ((filterCostCenter as CostCenter) || undefined);
    if (scopeForFilter !== 'VEHICLE' && !costCenterForFilter) {
      return [];
    }
    const allowed = getAllowedCategories(scopeForFilter, costCenterForFilter);
    return CATEGORY_OPTIONS.filter((opt) => allowed.includes(opt.value));
  }, [filterScope, filterCostCenter]);

  // Apply recurrence filter client-side
  const allCharges = useMemo(() => {
    if (!filterRecurrence) return allChargesRaw;
    if (filterRecurrence === 'NONE') return allChargesRaw.filter((c) => !c.recurring);
    return allChargesRaw.filter((c) => c.recurring && c.recurrencePeriod === filterRecurrence);
  }, [allChargesRaw, filterRecurrence]);

  // Summary stats with projected annual cost
  const summary = useMemo(() => {
    const total = allCharges.reduce((sum, c) => sum + Number(c.amount), 0);
    const byCategory: Record<string, number> = {};
    allCharges.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + Number(c.amount);
    });

    // Projected annual cost for recurring charges
    let annualProjected = 0;
    let monthlyTotal = 0;
    let quarterlyTotal = 0;
    let yearlyTotal = 0;
    allCharges.forEach((c) => {
      if (!c.recurring) return;
      const amt = Number(c.amount);
      if (c.recurrencePeriod === 'MONTHLY') {
        monthlyTotal += amt;
        annualProjected += amt * 12;
      } else if (c.recurrencePeriod === 'QUARTERLY') {
        quarterlyTotal += amt;
        annualProjected += amt * 4;
      } else if (c.recurrencePeriod === 'YEARLY') {
        yearlyTotal += amt;
        annualProjected += amt;
      }
    });

    return { total, byCategory, count: allCharges.length, annualProjected, monthlyTotal, quarterlyTotal, yearlyTotal };
  }, [allCharges]);

  // Vehicle lookup
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles?.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const getVehicleLabel = useCallback((vehicleId: string) => {
    const v = vehicleMap.get(vehicleId);
    return v ? `${v.brand} ${v.model} - ${v.registrationNumber}` : vehicleId.slice(0, 8);
  }, [vehicleMap]);

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
    setFormScope('VEHICLE');
    setFormCostCenter('AUTRE');
    setFormCategory('BANK_INSTALLMENT');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormRecurrencePeriod('NONE');
    setShowModal(true);
  };

  const openEditModal = (charge: Charge) => {
    setEditingCharge(charge);
    setFormVehicleId(charge.vehicleId || '');
    setFormScope((charge.scope || 'VEHICLE') as ChargeScope);
    setFormCostCenter((charge.costCenter || 'AUTRE') as CostCenter);
    setFormCategory(charge.category);
    setFormDescription(charge.description);
    setFormAmount(String(charge.amount));
    setFormDate(new Date(charge.date).toISOString().slice(0, 10));
    setFormRecurrencePeriod((charge.recurring ? (charge.recurrencePeriod as any) : 'NONE') || 'NONE');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCharge(null);
  };

  const handleSubmit = () => {
    if (!formAmount || !formDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (formScope === 'VEHICLE' && !formVehicleId) {
      toast.error('Veuillez sélectionner un véhicule pour une charge véhicule');
      return;
    }

    const data: CreateChargeDto = {
      agencyId,
      scope: formScope,
      vehicleId: formScope === 'VEHICLE' ? formVehicleId : undefined,
      costCenter: formScope !== 'VEHICLE' ? formCostCenter : undefined,
      category: formCategory,
      description: formDescription,
      amount: parseFloat(formAmount),
      date: formDate,
      recurring: formRecurrencePeriod !== 'NONE',
      recurrencePeriod: formRecurrencePeriod !== 'NONE' ? (formRecurrencePeriod as 'MONTHLY' | 'QUARTERLY' | 'YEARLY') : undefined,
    };

    if (editingCharge) {
      updateMutation.mutate({ id: editingCharge.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (charge: Charge) => {
    setDeletingCharge(charge);
  };

  const confirmDelete = () => {
    if (deletingCharge) {
      deleteMutation.mutate(deletingCharge.id);
      setDeletingCharge(null);
    }
  };

  const hasFilters =
    filterVehicle ||
    filterScope ||
    filterCostCenter ||
    filterCategory ||
    filterRecurrence ||
    filterDateFrom ||
    filterDateTo;

  useEffect(() => {
    if (filterCategory && !filterCategoryOptions.some((o) => o.value === filterCategory)) {
      setFilterCategory('');
    }
  }, [filterCategory, filterCategoryOptions]);

  useEffect(() => {
    if (filterScope === 'VEHICLE' && filterCostCenter) {
      setFilterCostCenter('');
    }
  }, [filterScope, filterCostCenter]);

  useEffect(() => {
    if ((filterScope === 'AGENCY' || filterScope === 'COMPANY') && filterVehicle) {
      setFilterVehicle('');
    }
  }, [filterScope, filterVehicle]);

  useEffect(() => {
    if (!formCategoryOptions.some((o) => o.value === formCategory)) {
      setFormCategory(formCategoryOptions[0]?.value || 'OTHER');
    }
  }, [formCategory, formCategoryOptions]);

  const handleExportCsv = useCallback(() => {
    const exportRows = allCharges.map((charge) => {
      const vehicleLabel =
        charge.scope === 'VEHICLE' && charge.vehicle
          ? `${charge.vehicle.brand} ${charge.vehicle.model} - ${charge.vehicle.registrationNumber}`
          : charge.scope === 'VEHICLE' && charge.vehicleId
            ? getVehicleLabel(charge.vehicleId)
            : '';
      const amount = Number(charge.amount);
      const parsedDate = new Date(charge.date);
      const exportDate = Number.isNaN(parsedDate.getTime())
        ? String(charge.date || '')
        : parsedDate.toISOString().slice(0, 10);
      return [
        exportDate,
        SCOPE_LABELS[(charge.scope || 'VEHICLE') as ChargeScope],
        charge.costCenter ? (COST_CENTER_LABELS[charge.costCenter as CostCenter] || charge.costCenter) : '',
        vehicleLabel,
        CATEGORY_LABELS[charge.category] || charge.category,
        charge.description || '',
        Number.isFinite(amount) ? amount.toFixed(2) : '',
        charge.recurring ? 'Oui' : 'Non',
        charge.recurrencePeriod || '',
      ];
    });

    if (!exportRows.length) {
      toast.error('Aucune donnée à exporter avec les filtres actuels');
      return;
    }

    const headers = [
      'Date',
      'Portée',
      'Centre de coût',
      'Véhicule',
      'Catégorie',
      'Description',
      'Montant',
      'Récurrence',
      'Période récurrence',
    ];

    const csv = [headers, ...exportRows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(';'))
      .join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    const dateTag = new Date().toISOString().slice(0, 10);
    link.download = `charges-export-${dateTag}.csv`;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 0);
    toast.success(`Export CSV généré (${exportRows.length} ligne${exportRows.length > 1 ? 's' : ''})`);
  }, [allCharges, getVehicleLabel]);

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_MANAGER']}>
      <MainLayout>
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2">
            <div>
              <h1 className="text-3xl font-bold text-text mb-1">Charges & Depenses</h1>
              <p className="text-text-muted text-sm">
                Gerez toutes les depenses de vos vehicules : mensualites, assurance, vignette, maintenance, carburant...
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExportCsv}
                className="w-full sm:w-auto md:shrink-0 whitespace-nowrap px-5 py-2.5 rounded-lg border border-border bg-card text-text font-medium text-sm hover:bg-background transition-colors shadow-lg"
              >
                Exporter
              </button>
              <button
                onClick={openNewModal}
                className="w-full sm:w-auto md:shrink-0 whitespace-nowrap px-5 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg"
              >
                + Nouvelle charge
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow">
              <p className="text-xs text-text-muted font-medium">Total charges</p>
              <p className="text-xl font-bold text-text mt-1">{formatAmount(summary.total)}</p>
              <p className="text-xs text-text-muted">{summary.count} charge(s)</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow">
              <p className="text-xs text-text-muted font-medium">Coût annuel projeté</p>
              <p className="text-xl font-bold text-primary mt-1">{formatAmount(summary.annualProjected)}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {summary.monthlyTotal > 0 && (
                  <p className="text-xs text-text-muted">{formatAmount(summary.monthlyTotal)}/mois</p>
                )}
                {summary.quarterlyTotal > 0 && (
                  <p className="text-xs text-text-muted">{formatAmount(summary.quarterlyTotal)}/trim.</p>
                )}
                {summary.yearlyTotal > 0 && (
                  <p className="text-xs text-text-muted">{formatAmount(summary.yearlyTotal)}/an</p>
                )}
              </div>
            </div>
            {Object.entries(summary.byCategory)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 2)
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
              {isCompanyAdmin && companyAgencies.length > 1 && (
                <div className="flex-1 min-w-[180px] max-w-xs">
                  <label className="block text-xs font-medium text-text mb-1">Agence</label>
                  <select
                    value={agencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                  >
                    {companyAgencies.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex-1 min-w-[180px] max-w-xs">
                <label className="block text-xs font-medium text-text mb-1">Vehicule</label>
                <select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  disabled={filterScope === 'AGENCY' || filterScope === 'COMPANY'}
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
              <div className="min-w-[160px]">
                <label className="block text-xs font-medium text-text mb-1">Portée</label>
                <select
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">Toutes</option>
                  <option value="VEHICLE">Véhicule</option>
                  <option value="AGENCY">Agence</option>
                  <option value="COMPANY">Société</option>
                </select>
              </div>
              <div className="min-w-[160px]">
                <label className="block text-xs font-medium text-text mb-1">Centre de coût</label>
                <select
                  value={filterCostCenter}
                  onChange={(e) => setFilterCostCenter(e.target.value)}
                  disabled={filterScope !== 'AGENCY' && filterScope !== 'COMPANY'}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">
                    {filterScope === 'AGENCY' || filterScope === 'COMPANY'
                      ? 'Tous'
                      : 'Choisir d’abord une portée Agence/Société'}
                  </option>
                  {COST_CENTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[180px]">
                <label className="block text-xs font-medium text-text mb-1">Categorie</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  disabled={!filterScope || ((filterScope === 'AGENCY' || filterScope === 'COMPANY') && !filterCostCenter)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">
                    {!filterScope
                      ? 'Choisir d’abord une portée'
                      : ((filterScope === 'AGENCY' || filterScope === 'COMPANY') && !filterCostCenter)
                        ? 'Choisir d’abord un centre de coût'
                        : 'Toutes'}
                  </option>
                  {filterCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px]">
                <label className="block text-xs font-medium text-text mb-1">Récurrence</label>
                <select
                  value={filterRecurrence}
                  onChange={(e) => setFilterRecurrence(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-text text-sm"
                >
                  <option value="">Toutes</option>
                  <option value="MONTHLY">Mensuel</option>
                  <option value="QUARTERLY">Trimestriel</option>
                  <option value="YEARLY">Annuel</option>
                  <option value="NONE">Ponctuelle</option>
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
                  onClick={() => {
                    setFilterVehicle('');
                    setFilterScope('');
                    setFilterCostCenter('');
                    setFilterCategory('');
                    setFilterRecurrence('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
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
                      <th className="text-left py-3 px-4 font-medium text-text-muted">Portée</th>
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
                            {charge.scope === 'VEHICLE' && charge.vehicle
                              ? `${charge.vehicle.brand} ${charge.vehicle.model} - ${charge.vehicle.registrationNumber}`
                              : charge.scope === 'VEHICLE' && charge.vehicleId
                                ? getVehicleLabel(charge.vehicleId)
                                : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-text">
                                {SCOPE_LABELS[(charge.scope || 'VEHICLE') as ChargeScope]}
                              </span>
                              {charge.costCenter && (
                                <span className="text-xs text-text-muted">
                                  {COST_CENTER_LABELS[charge.costCenter as CostCenter] || charge.costCenter}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${color}20`, color }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                              {CATEGORY_LABELS[charge.category] || charge.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-muted max-w-[200px] truncate">{charge.description || '-'}</td>
                          <td className="py-3 px-4 text-right font-semibold text-text">{formatAmount(Number(charge.amount))}</td>
                          <td className="py-3 px-4">
                            {charge.recurring ? (
                              <div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  {RECURRENCE_LABELS[charge.recurrencePeriod || ''] || charge.recurrencePeriod || 'Oui'}
                                </span>
                                <p className="text-xs text-text-muted mt-1">
                                  {charge.recurrencePeriod === 'MONTHLY' && `${formatAmount(Number(charge.amount) * 12)}/an`}
                                  {charge.recurrencePeriod === 'QUARTERLY' && `${formatAmount(Number(charge.amount) * 4)}/an`}
                                  {charge.recurrencePeriod === 'YEARLY' && `${formatAmount(Number(charge.amount))}/an`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-text-muted">Ponctuelle</span>
                            )}
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

        {/* Delete Confirmation Modal */}
        {deletingCharge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm bg-card rounded-xl border border-border shadow-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-text">Confirmer la suppression</h3>
              <p className="text-sm text-text-muted">
                Voulez-vous vraiment supprimer cette charge de{' '}
                <span className="font-semibold text-text">{formatAmount(Number(deletingCharge.amount))}</span> ?
              </p>
              <p className="text-xs text-text-muted">
                {CATEGORY_LABELS[deletingCharge.category] || deletingCharge.category}
                {deletingCharge.description ? ` - ${deletingCharge.description}` : ''}
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setDeletingCharge(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-text hover:bg-background transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Portée *</label>
                    <Select
                      value={formScope}
                      onChange={(e) => setFormScope(e.target.value as ChargeScope)}
                    >
                      <option value="VEHICLE">Véhicule</option>
                      <option value="AGENCY">Agence</option>
                      <option value="COMPANY">Société</option>
                    </Select>
                  </div>
                  {formScope !== 'VEHICLE' && (
                    <div>
                      <label className="block text-xs font-medium text-text mb-1">Centre de coût</label>
                      <Select
                        value={formCostCenter}
                        onChange={(e) => setFormCostCenter(e.target.value as CostCenter)}
                      >
                        {COST_CENTER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>

                {/* Vehicule */}
                {formScope === 'VEHICLE' && (
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
                )}

                {/* Categorie */}
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Categorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ChargeCategory)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                  >
                    {formCategoryOptions.map((opt) => (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-text mb-1">Périodicité</label>
                  <select
                    value={formRecurrencePeriod}
                    onChange={(e) => setFormRecurrencePeriod(e.target.value as 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text text-sm"
                  >
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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
