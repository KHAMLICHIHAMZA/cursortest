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
  // Le proxy Vite redirige /api vers http://localhost:3000
  // On doit construire l'URL complète pour les images
  const baseUrl = 'http://localhost:3000';
  
  // S'assurer que l'URL relative commence par "/"
  const relativeUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${relativeUrl}`;
}




