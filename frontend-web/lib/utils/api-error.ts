type UnknownRecord = Record<string, unknown>;

function formatValidationObject(value: UnknownRecord): string[] {
  const messages: string[] = [];

  const constraints = value.constraints;
  if (constraints && typeof constraints === 'object') {
    for (const constraintMessage of Object.values(constraints as UnknownRecord)) {
      if (typeof constraintMessage === 'string' && constraintMessage.trim()) {
        messages.push(constraintMessage.trim());
      }
    }
  }

  const nestedMessage = value.message;
  if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
    messages.push(nestedMessage.trim());
  } else if (Array.isArray(nestedMessage)) {
    for (const item of nestedMessage) {
      if (typeof item === 'string' && item.trim()) {
        messages.push(item.trim());
      }
    }
  }

  return messages;
}

function normalizeMessageValue(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeMessageValue(item));
  }

  if (typeof value === 'object') {
    return formatValidationObject(value as UnknownRecord);
  }

  return [];
}

export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  const e = error as any;
  const data = e?.response?.data;
  const hasResponsePayload = Boolean(data && typeof data === 'object');
  const candidates = hasResponsePayload
    ? [data?.message, data?.error]
    : [e?.message];

  const messages = candidates.flatMap((candidate) => normalizeMessageValue(candidate));
  const uniqueMessages = Array.from(new Set(messages.filter(Boolean)));

  if (uniqueMessages.length === 0) return fallback;
  if (uniqueMessages.length === 1) return uniqueMessages[0];
  return uniqueMessages.join(' • ');
}

/** Messages clairs quand l’API est injoignable (mauvaise URL en prod, CORS, réseau). */
export function getLoginErrorMessage(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: unknown };
    code?: string;
    message?: string;
  };

  if (!err?.response) {
    const code = err?.code;
    const msg = String(err?.message ?? '');
    if (code === 'ECONNABORTED' || /timeout/i.test(msg)) {
      return 'Le serveur met trop longtemps à répondre (cold start ou surcharge). Réessayez dans un instant. Si ça persiste après un nouveau déploiement du backend, vérifiez les logs Render.';
    }
    if (
      code === 'ERR_NETWORK' ||
      msg === 'Network Error' ||
      code === 'ECONNREFUSED'
    ) {
      return "Impossible de joindre l'API. En déploiement (ex. Vercel), définissez NEXT_PUBLIC_API_URL sur l'URL publique du backend, puis reconstruisez le frontend. Vérifiez aussi CORS et que le backend est accessible.";
    }
    return 'Connexion impossible. Vérifiez votre réseau ou la configuration du serveur.';
  }

  const status = Number(err.response.status);
  if (status === 401 || status === 403) {
    const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
    const msg = data?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
    return getApiErrorMessage(
      error,
      'Identifiants incorrects ou compte / société inactif.',
    );
  }
  if (Number.isFinite(status) && status >= 500) {
    const detail = getApiErrorMessage(error, '');
    if (detail && !/^internal server error$/i.test(detail.trim())) {
      return detail;
    }
    return "Erreur serveur. Si le déploiement backend vient de finir, réessayez dans une minute. Sinon vérifiez les logs Render (migrations Prisma au démarrage).";
  }

  return getApiErrorMessage(
    error,
    'Erreur de connexion. Vérifiez vos identifiants.',
  );
}
