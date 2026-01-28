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
  
  // Construire l'URL complète avec l'URL du backend
  // NEXT_PUBLIC_API_URL est généralement "http://localhost:3000/api/v1"
  // On doit enlever "/api/v1" (ou "/api") pour obtenir la base URL du serveur
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  const baseUrl = apiUrl.replace('/api/v1', '').replace('/api', '');
  
  // S'assurer que l'URL relative commence par "/"
  const relativeUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${relativeUrl}`;
}


