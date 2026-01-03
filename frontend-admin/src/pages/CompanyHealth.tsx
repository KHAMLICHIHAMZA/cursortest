import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { AlertCircle, CheckCircle, Clock, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

export default function CompanyHealth() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies');
      return res.data;
    },
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const res = await api.get(`/companies/${selectedCompanyId}`);
      return res.data;
    },
    enabled: !!selectedCompanyId,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const res = await api.get('/subscriptions');
      const subscriptions = res.data;
      return subscriptions.find((s: any) => s.companyId === selectedCompanyId);
    },
    enabled: !!selectedCompanyId,
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const res = await api.get(`/billing/company/${selectedCompanyId}/invoices`);
      return res.data;
    },
    enabled: !!selectedCompanyId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'SUSPENDED':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'DELETED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return CheckCircle;
      case 'SUSPENDED':
        return AlertCircle;
      case 'DELETED':
        return XCircle;
      default:
        return Clock;
    }
  };

  const calculateDaysUntilExpiration = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const calculateDaysSinceSuspension = (suspendedAt: string) => {
    if (!suspendedAt) return null;
    const suspended = new Date(suspendedAt);
    const now = new Date();
    const diff = Math.ceil((now.getTime() - suspended.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (!selectedCompanyId) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Santé du compte</h1>
        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sélectionner une entreprise
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white"
          >
            <option value="">-- Sélectionner --</option>
            {companies?.map((company: any) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (companyLoading) return <div className="text-center py-8">Chargement...</div>;

  const daysUntilExpiration = subscription?.endDate
    ? calculateDaysUntilExpiration(subscription.endDate)
    : null;
  const daysSinceSuspension = company?.suspendedAt
    ? calculateDaysSinceSuspension(company.suspendedAt)
    : null;
  const canRestore = daysSinceSuspension !== null && daysSinceSuspension <= 90;
  const willBeDeleted = daysSinceSuspension !== null && daysSinceSuspension >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Santé du compte</h1>
          <p className="text-gray-400 mt-2">
            {company?.name || 'Sélectionner une entreprise'}
          </p>
        </div>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="px-4 py-2 bg-[#2C2F36] border border-gray-600 rounded-lg text-white"
        >
          {companies?.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Alertes */}
      <div className="space-y-4 mb-8">
        {company?.status === 'SUSPENDED' && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-400 mb-1">Compte suspendu</h3>
              <p className="text-sm text-gray-300">
                {company.suspendedReason || 'Aucune raison spécifiée'}
              </p>
              {daysSinceSuspension !== null && (
                <p className="text-sm text-gray-400 mt-1">
                  Suspendu depuis {daysSinceSuspension} jour{daysSinceSuspension > 1 ? 's' : ''}
                  {canRestore && ` • Restauration possible jusqu'à J+90 (${90 - daysSinceSuspension} jours restants)`}
                  {willBeDeleted && ' • ⚠️ Suppression définitive imminente (J+100)'}
                </p>
              )}
            </div>
          </div>
        )}

        {subscription && daysUntilExpiration !== null && daysUntilExpiration < 30 && (
          <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4 flex items-start gap-3">
            <Clock className="text-orange-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-400 mb-1">Abonnement expire bientôt</h3>
              <p className="text-sm text-gray-300">
                L'abonnement expire dans {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {invoices?.some((inv: any) => inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()) && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-1">Factures en retard</h3>
              <p className="text-sm text-gray-300">
                {invoices.filter((inv: any) => inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()).length} facture(s) en retard de paiement
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statut du compte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Statut du compte</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Statut</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(company?.status || '')}`}>
                {company?.status === 'ACTIVE' && 'Actif'}
                {company?.status === 'SUSPENDED' && 'Suspendu'}
                {company?.status === 'DELETED' && 'Supprimé'}
              </span>
            </div>
            {company?.suspendedAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Suspendu le</span>
                <span className="text-white">
                  {new Date(company.suspendedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {company?.currency && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Devise</span>
                <span className="text-white">{company.currency}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Abonnement</h2>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Plan</span>
                <span className="text-white">{subscription.plan?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Périodicité</span>
                <span className="text-white">
                  {subscription.billingPeriod === 'MONTHLY' && 'Mensuel'}
                  {subscription.billingPeriod === 'QUARTERLY' && 'Trimestriel'}
                  {subscription.billingPeriod === 'YEARLY' && 'Annuel'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Montant</span>
                <span className="text-white">{subscription.amount?.toFixed(2)} MAD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Date d'expiration</span>
                <span className="text-white">
                  {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Statut</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                  {getStatusLabel(subscription.status)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Aucun abonnement</p>
          )}
        </div>
      </div>

      {/* Factures récentes */}
      <div className="bg-[#2C2F36] rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Factures récentes</h2>
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1D1F23]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Numéro</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Montant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Échéance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {invoices.slice(0, 10).map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-[#1D1F23]">
                    <td className="px-4 py-3 text-sm text-white">{invoice.invoiceNumber || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{invoice.amount?.toFixed(2)} MAD</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.status === 'PAID'
                            ? 'bg-green-500/20 text-green-400'
                            : invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date()
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {invoice.status === 'PAID' && 'Payé'}
                        {invoice.status === 'PENDING' && 'En attente'}
                        {invoice.status === 'FAILED' && 'Échoué'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">Aucune facture</p>
        )}
      </div>
    </div>
  );

  function getStatusLabel(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'SUSPENDED':
        return 'Suspendu';
      case 'EXPIRED':
        return 'Expiré';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  }
}


