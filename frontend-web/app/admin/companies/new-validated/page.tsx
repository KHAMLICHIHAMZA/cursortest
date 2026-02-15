'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyApi } from '@/lib/api/company';
import { createCompanySchema, CreateCompanyFormData } from '@/lib/validations/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';

export default function NewCompanyPageValidated() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      raisonSociale: '',
      identifiantLegal: '',
      formeJuridique: 'AUTRE',
      phone: '',
      address: '',
      adminEmail: '',
      adminName: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyFormData) => companyApi.create(data),
    onSuccess: () => {
      toast.success('Entreprise créée avec succès');
      router.push('/admin/companies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateCompanyFormData) => {
    createMutation.mutate(data);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Link href="/admin/companies">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-text mb-8">Nouvelle entreprise</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border border-border rounded-lg p-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nom de l'entreprise *
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Location Auto Maroc"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="raisonSociale" className="block text-sm font-medium text-text mb-2">
                Raison sociale *
              </label>
              <Input
                id="raisonSociale"
                {...register('raisonSociale')}
                placeholder="Ex: Location Auto Maroc SARL"
              />
              {errors.raisonSociale && <p className="text-red-500 text-sm mt-1">{errors.raisonSociale.message}</p>}
            </div>

            <div>
              <label htmlFor="identifiantLegal" className="block text-sm font-medium text-text mb-2">
                Identifiant légal (ICE) *
              </label>
              <Input
                id="identifiantLegal"
                {...register('identifiantLegal')}
                placeholder="Ex: 001234567000089"
              />
              {errors.identifiantLegal && (
                <p className="text-red-500 text-sm mt-1">{errors.identifiantLegal.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="formeJuridique" className="block text-sm font-medium text-text mb-2">
                Forme juridique *
              </label>
              <select
                id="formeJuridique"
                {...register('formeJuridique')}
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
              {errors.formeJuridique && (
                <p className="text-red-500 text-sm mt-1">{errors.formeJuridique.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text mb-2">
                Téléphone
              </label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+212 6XX XXX XXX"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text mb-2">
                Adresse
              </label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Adresse complète"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
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
                    {...register('adminName')}
                    placeholder="Nom complet"
                  />
                  {errors.adminName && <p className="text-red-500 text-sm mt-1">{errors.adminName.message}</p>}
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-text mb-2">
                    Email de l'administrateur
                  </label>
                  <Input
                    id="adminEmail"
                    type="email"
                    {...register('adminEmail')}
                    placeholder="admin@entreprise.com"
                  />
                  {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting || createMutation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || createMutation.isPending}>
                {isSubmitting || createMutation.isPending ? 'Création...' : 'Créer l\'entreprise'}
              </Button>
            </div>
          </form>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}



