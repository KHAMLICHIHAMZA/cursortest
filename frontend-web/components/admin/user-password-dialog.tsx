'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, User } from '@/lib/api/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

type Props = {
  user: User | null;
  open: boolean;
  onClose: () => void;
};

function randomPassword(): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  const arr = new Uint8Array(14);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < 14; i++) {
    s += chars[arr[i]! % chars.length];
  }
  return s;
}

export function UserPasswordDialog({ user, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [sendEmail, setSendEmail] = useState(false);
  const [password, setPassword] = useState('');
  const [shownOnce, setShownOnce] = useState<string | null>(null);

  const setPasswordMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('no user');
      const trimmed = password.trim();
      return userApi.adminSetPassword(user.id, {
        sendEmail,
        ...(trimmed.length >= 8 ? { password: trimmed } : {}),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (data.temporaryPassword) {
        setShownOnce(data.temporaryPassword);
        toast.success(data.message);
      } else if (data.emailed) {
        toast.success(data.message);
        handleClose();
      } else {
        toast.success(data.message);
        handleClose();
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Erreur lors de la mise à jour du mot de passe';
      toast.error(msg);
    },
  });

  const resetLinkMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('no user');
      return userApi.resetPassword(user.id);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'E-mail envoyé');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de l'e-mail");
    },
  });

  const handleClose = () => {
    setSendEmail(false);
    setPassword('');
    setShownOnce(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-password-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-card border border-border rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div>
          <h2 id="user-password-dialog-title" className="text-lg font-semibold text-text">
            Mot de passe — {user?.name || 'Utilisateur'}
          </h2>
          <p className="text-sm text-text-muted mt-1">{user?.email}</p>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4 bg-background/50">
          <p className="text-sm font-medium text-text">Lien par e-mail (comportement actuel)</p>
          <p className="text-xs text-text-muted">
            Envoie un e-mail avec un lien pour que l&apos;utilisateur choisisse son mot de passe.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resetLinkMutation.isPending || setPasswordMutation.isPending}
            onClick={() => resetLinkMutation.mutate()}
          >
            {resetLinkMutation.isPending ? 'Envoi...' : 'Envoyer l’e-mail de réinitialisation'}
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-text">Mot de passe immédiat (admin)</p>
          <p className="text-xs text-text-muted">
            Définit tout de suite le mot de passe. Utile si la boîte mail ne reçoit pas les
            messages : laissez le champ vide pour générer un mot de passe aléatoire, ou saisissez-en
            un (min. 8 caractères).
          </p>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-text">
              Envoyer aussi ce mot de passe par e-mail à l&apos;utilisateur
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              autoComplete="new-password"
              placeholder="Laisser vide = génération automatique"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setPassword(randomPassword())}
            >
              Générer
            </Button>
          </div>

          {shownOnce && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                Copiez ce mot de passe maintenant — il ne sera plus affiché.
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-sm break-all bg-background px-2 py-1 rounded border border-border">
                  {shownOnce}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    void navigator.clipboard.writeText(shownOnce);
                    toast.success('Copié');
                  }}
                >
                  Copier
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {shownOnce ? 'Fermer' : 'Annuler'}
            </Button>
            {!shownOnce && (
              <Button
                type="button"
                variant="primary"
                disabled={
                  setPasswordMutation.isPending ||
                  resetLinkMutation.isPending ||
                  (!!password.trim() && password.trim().length < 8)
                }
                onClick={() => setPasswordMutation.mutate()}
              >
                {setPasswordMutation.isPending ? 'En cours...' : 'Appliquer le mot de passe'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
