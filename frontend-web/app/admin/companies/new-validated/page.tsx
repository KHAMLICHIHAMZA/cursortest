'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyApi } from '@/lib/api/company';
import { createCompanySchema, CreateCompanyFormData } from '@/lib/validations/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';
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
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<CreateCompanyFormData, 'adminEmail' | 'adminName'>) =>
      companyApi.create(data),
    onSuccess: (createdCompany) => {
      toast.success('Entreprise créée avec succès');
      router.push(`/admin/companies/${createdCompany.id}?section=pack`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateCompanyFormData) => {
    const { adminEmail, adminName, ...payload } = data;
    void adminEmail;
    void adminName;
    createMutation.mutate(payload);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
        <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6 px-2 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Étape 1 - Informations entreprise</CardTitle>
              <p className="text-sm text-text-muted mt-1">
                Créez l&apos;entreprise puis continuez sur les étapes pack, capacité et abonnement.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-text-muted">
                    Workflow: étape 2 pack, étape 3 capacité agences, étape 4 abonnement final.
                  </p>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button type="submit" variant="primary" disabled={isSubmitting || createMutation.isPending}>
                    {isSubmitting || createMutation.isPending ? 'Création...' : "Créer l'entreprise"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteGuard>
  );
}



