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

