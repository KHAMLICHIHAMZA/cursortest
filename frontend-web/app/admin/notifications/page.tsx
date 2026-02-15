'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Send, Bell, Building2, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/main-layout';
import { RouteGuard } from '@/components/auth/route-guard';

interface Company {
  id: string;
  name: string;
}

interface BroadcastHistory {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  metadata?: {
    broadcast?: boolean;
    targetCompanyId?: string;
  };
}

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'company'>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch companies for the select dropdown
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await apiClient.get('/companies');
      return res.data;
    },
  });

  // Fetch recent broadcast notifications (sent by current admin)
  const { data: recentNotifications = [] } = useQuery<BroadcastHistory[]>({
    queryKey: ['admin-broadcasts'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/in-app', {
        params: { type: 'ADMIN_ANNOUNCEMENT', limit: '50' },
      });
      return res.data;
    },
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      message: string;
      companyId?: string;
      actionUrl?: string;
    }) => {
      const res = await apiClient.post('/notifications/in-app/broadcast', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccess(`Notification envoyee a ${data.notificationsSent} utilisateur(s)`);
      setError('');
      setTitle('');
      setMessage('');
      setActionUrl('');
      setTargetType('all');
      setSelectedCompanyId('');
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi');
      setSuccess('');
    },
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      setError('Le titre et le message sont obligatoires');
      return;
    }

    const payload: any = {
      title: title.trim(),
      message: message.trim(),
    };

    if (targetType === 'company' && selectedCompanyId) {
      payload.companyId = selectedCompanyId;
    }

    if (actionUrl.trim()) {
      payload.actionUrl = actionUrl.trim();
    }

    broadcastMutation.mutate(payload);
  };

  const getTargetLabel = (notif: BroadcastHistory) => {
    if (notif.metadata?.targetCompanyId === 'ALL') {
      return 'Toutes les entreprises';
    }
    const company = companies.find((c) => c.id === notif.metadata?.targetCompanyId);
    return company?.name || notif.metadata?.targetCompanyId || '-';
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <MainLayout>
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Notifications - Diffusion
        </h1>
        <p className="text-text-muted mt-1">
          Envoyez des notifications push a une entreprise ou a toutes les entreprises
        </p>
      </div>

      {/* Compose Form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text">Composer une notification</h2>

        {/* Target */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Destinataire</label>
            <Select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as 'all' | 'company');
                if (e.target.value === 'all') setSelectedCompanyId('');
              }}
            >
              <option value="all">Toutes les entreprises</option>
              <option value="company">Une entreprise specifique</option>
            </Select>
          </div>

          {targetType === 'company' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Entreprise</label>
              <Select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">-- Choisir --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Titre</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Maintenance prevue le 15 fevrier"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Redigez le contenu de la notification..."
            rows={4}
          />
        </div>

        {/* Action URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            URL d&apos;action (optionnel)
          </label>
          <Input
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="Ex: /admin/company-health"
          />
        </div>

        {/* Feedback messages */}
        {success && (
          <div className="flex items-center gap-2 text-green-400 bg-green-900/20 border border-green-700 rounded-lg p-3">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-700 rounded-lg p-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Send button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={broadcastMutation.isPending || !title.trim() || !message.trim()}
            className="flex items-center gap-2"
          >
            {broadcastMutation.isPending ? (
              <>Envoi en cours...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {targetType === 'all' ? (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Envoyer a toutes les entreprises
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Envoyer a l&apos;entreprise
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Recent broadcasts */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-text mb-4">Historique des diffusions</h2>

        {recentNotifications.length === 0 ? (
          <p className="text-text-muted text-center py-8">Aucune diffusion envoyee pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentNotifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notif.title}</div>
                        <div className="text-text-muted text-sm truncate max-w-xs">
                          {notif.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {notif.metadata?.targetCompanyId === 'ALL' ? (
                        <Badge status="active">
                          <Globe className="w-3 h-3 mr-1" />
                          Toutes
                        </Badge>
                      ) : (
                        <Badge status="pending">
                          <Building2 className="w-3 h-3 mr-1" />
                          {getTargetLabel(notif)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge status={notif.status === 'SENT' ? 'success' : notif.status === 'READ' ? 'completed' : 'pending'}>
                        {notif.status === 'SENT' ? 'Envoyee' : notif.status === 'READ' ? 'Lue' : notif.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
      </MainLayout>
    </RouteGuard>
  );
}
