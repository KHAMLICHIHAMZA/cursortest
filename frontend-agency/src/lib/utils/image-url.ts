/**
 * Construit l'URL complète d'une image à partir d'une URL relative retournée par le backend
 * @param imageUrl URL relative (ex: /uploads/vehicles/image.jpg) ou URL complète
 * @returns URL complète pointant vers le backend
 */
export function getImageUrl(imageUrl?: string | null): string | undefined {
  if (!imageUrl) return undefined;
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Construire l'URL complète avec l'URL du backend.
  // Priorité: VITE_BACKEND_URL, sinon dériver depuis VITE_API_URL.
  const backendBaseUrl =
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '').replace('/api', '')
      : '') ||
    'http://localhost:3000';
  const normalizedBaseUrl = backendBaseUrl.endsWith('/')
    ? backendBaseUrl.slice(0, -1)
    : backendBaseUrl;
  
  // S'assurer que l'URL relative commence par "/"
  const relativeUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${normalizedBaseUrl}${relativeUrl}`;
}




