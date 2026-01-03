import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Charger le fichier JSON de manière dynamique
// En dev: depuis src/data/ (process.cwd() = backend/)
// En prod: depuis data/ à la racine backend (process.cwd() = backend/)
function loadVehicleDatabase() {
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'data', 'vehicle-database.json'), // Dev: backend/src/data/
    path.join(process.cwd(), 'data', 'vehicle-database.json'), // Prod: backend/data/
    path.join(__dirname, '..', '..', '..', 'src', 'data', 'vehicle-database.json'), // Depuis dist vers src
    path.join(__dirname, '..', '..', '..', 'data', 'vehicle-database.json'), // Depuis dist vers data
  ];

  for (const dbPath of possiblePaths) {
    try {
      if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      }
    } catch (e) {
      // Continue to next path
    }
  }

  throw new Error(`Vehicle database not found. Tried: ${possiblePaths.join(', ')}`);
}

const vehicleDatabase = loadVehicleDatabase();

export interface VehicleSuggestion {
  brand: string;
  model: string;
  years: number[];
  horsepower: number[];
  fuel: string[];
  gearbox: string[];
}

@Injectable()
export class VehicleSearchService {
  private vehicles = vehicleDatabase as Array<{
    brand: string;
    models: Array<{
      name: string;
      years: number[];
      horsepower: number[];
      fuel: string[];
      gearbox: string[];
    }>;
  }>;

  /**
   * Recherche de marques correspondant au terme de recherche
   */
  searchBrands(query: string): string[] {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase().trim();
    return this.vehicles
      .map((v) => v.brand)
      .filter((brand) => brand.toLowerCase().includes(searchTerm))
      .slice(0, 10);
  }

  /**
   * Recherche de modèles pour une marque donnée
   */
  searchModels(brand: string, query?: string): VehicleSuggestion[] {
    const brandData = this.vehicles.find(
      (v) => v.brand.toLowerCase() === brand.toLowerCase(),
    );

    if (!brandData) return [];

    let models = brandData.models;

    // Filtrer par terme de recherche si fourni
    if (query && query.length >= 2) {
      const searchTerm = query.toLowerCase().trim();
      models = models.filter((m) =>
        m.name.toLowerCase().includes(searchTerm),
      );
    }

    return models.map((model) => ({
      brand: brandData.brand,
      model: model.name,
      years: model.years,
      horsepower: model.horsepower,
      fuel: model.fuel,
      gearbox: model.gearbox,
    }));
  }

  /**
   * Recherche complète (marque + modèle)
   */
  searchVehicles(brandQuery?: string, modelQuery?: string): VehicleSuggestion[] {
    let results: VehicleSuggestion[] = [];

    // Si on a une marque, chercher les modèles
    if (brandQuery && brandQuery.length >= 2) {
      const brandData = this.vehicles.find(
        (v) => v.brand.toLowerCase() === brandQuery.toLowerCase().trim(),
      );

      if (brandData) {
        let models = brandData.models;

        // Filtrer par modèle si fourni
        if (modelQuery && modelQuery.length >= 2) {
          const searchTerm = modelQuery.toLowerCase().trim();
          models = models.filter((m) =>
            m.name.toLowerCase().includes(searchTerm),
          );
        }

        results = models.map((model) => ({
          brand: brandData.brand,
          model: model.name,
          years: model.years,
          horsepower: model.horsepower,
          fuel: model.fuel,
          gearbox: model.gearbox,
        }));
      }
    } else if (modelQuery && modelQuery.length >= 2) {
      // Recherche globale par modèle
      const searchTerm = modelQuery.toLowerCase().trim();
      this.vehicles.forEach((brandData) => {
        brandData.models
          .filter((m) => m.name.toLowerCase().includes(searchTerm))
          .forEach((model) => {
            results.push({
              brand: brandData.brand,
              model: model.name,
              years: model.years,
              horsepower: model.horsepower,
              fuel: model.fuel,
              gearbox: model.gearbox,
            });
          });
      });
    }

    return results.slice(0, 20); // Limiter à 20 résultats
  }

  /**
   * Obtenir les détails complets d'un véhicule
   */
  getVehicleDetails(brand: string, model: string): VehicleSuggestion | null {
    const brandData = this.vehicles.find(
      (v) => v.brand.toLowerCase() === brand.toLowerCase(),
    );

    if (!brandData) return null;

    const modelData = brandData.models.find(
      (m) => m.name.toLowerCase() === model.toLowerCase(),
    );

    if (!modelData) return null;

    return {
      brand: brandData.brand,
      model: modelData.name,
      years: modelData.years,
      horsepower: modelData.horsepower,
      fuel: modelData.fuel,
      gearbox: modelData.gearbox,
    };
  }
}

