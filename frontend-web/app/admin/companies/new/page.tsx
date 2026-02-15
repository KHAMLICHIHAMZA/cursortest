'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { companyApi, CreateCompanyDto } from '@/lib/api/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormCard } from '@/components/ui/form-card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { toast } from '@/components/ui/toast';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyDto) => companyApi.create(data),
    onSuccess: () => {
      toast.success('Entreprise créée avec succès');
      router.push('/admin/companies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
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

    createMutation.mutate(formData);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxAgencies" className="block text-sm font-medium text-text mb-2">
                  Nombre max d&apos;agences
                </label>
                <Input
                  id="maxAgencies"
                  type="number"
                  min="0"
                  value={(formData as any).maxAgencies ?? ''}
                  onChange={(e) => setFormData({ ...formData, maxAgencies: e.target.value ? parseInt(e.target.value) : undefined } as any)}
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
                  value={(formData as any).bookingNumberMode || 'AUTO'}
                  onChange={(e) => setFormData({ ...formData, bookingNumberMode: e.target.value } as any)}
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

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-sm">
              {errors.submit}
            </div>
          )}
        </FormCard>
      </MainLayout>
    </RouteGuard>
  );
}

