/**
 * Decorator pour indiquer qu'un modèle supporte le soft delete
 * Utilisé pour la documentation et la génération automatique de filtres
 */
export const SoftDelete = () => {
  return (target: any) => {
    // Metadata pour indiquer que le modèle supporte soft delete
    Reflect.defineMetadata('softDelete', true, target);
  };
};





