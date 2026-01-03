'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Card } from './card';
import { vehicleApi } from '@/lib/api/vehicle';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Loader2, Car } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface VehicleSuggestion {
  brand: string;
  model: string;
  years: number[];
  horsepower: number[];
  fuel: string[];
  gearbox: string[];
}

interface VehicleAutocompleteProps {
  onSelect: (vehicle: VehicleSuggestion) => void;
  selectedVehicle?: VehicleSuggestion | null;
  className?: string;
}

export function VehicleAutocomplete({
  onSelect,
  selectedVehicle,
  className,
}: VehicleAutocompleteProps) {
  const [brandQuery, setBrandQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<VehicleSuggestion[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showBrandsDropdown, setShowBrandsDropdown] = useState(false);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedBrandQuery = useDebounce(brandQuery, 300);
  const debouncedModelQuery = useDebounce(modelQuery, 300);

  // Recherche de marques
  useEffect(() => {
    if (debouncedBrandQuery.length >= 2 && !selectedBrand) {
      setIsLoadingBrands(true);
      vehicleApi
        .searchBrands(debouncedBrandQuery)
        .then((results) => {
          setBrands(results);
          setShowBrandsDropdown(true);
        })
        .catch(() => {
          setBrands([]);
        })
        .finally(() => {
          setIsLoadingBrands(false);
        });
    } else {
      setBrands([]);
      setShowBrandsDropdown(false);
    }
  }, [debouncedBrandQuery, selectedBrand]);

  // Recherche de modèles
  useEffect(() => {
    if (selectedBrand && debouncedModelQuery.length >= 2) {
      setIsLoadingModels(true);
      vehicleApi
        .searchModels(selectedBrand, debouncedModelQuery)
        .then((results) => {
          setModels(results);
          setShowModelsDropdown(true);
        })
        .catch(() => {
          setModels([]);
        })
        .finally(() => {
          setIsLoadingModels(false);
        });
    } else if (selectedBrand) {
      // Charger tous les modèles de la marque
      setIsLoadingModels(true);
      vehicleApi
        .searchModels(selectedBrand)
        .then((results) => {
          setModels(results);
          setShowModelsDropdown(true);
        })
        .catch(() => {
          setModels([]);
        })
        .finally(() => {
          setIsLoadingModels(false);
        });
    } else {
      setModels([]);
      setShowModelsDropdown(false);
    }
  }, [selectedBrand, debouncedModelQuery]);

  // Fermer les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowBrandsDropdown(false);
        setShowModelsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setBrandQuery(brand);
    setShowBrandsDropdown(false);
    setModelQuery('');
    setModels([]);
  };

  const handleModelSelect = (vehicle: VehicleSuggestion) => {
    onSelect(vehicle);
    setModelQuery(`${vehicle.brand} ${vehicle.model}`);
    setShowModelsDropdown(false);
  };

  // Initialiser avec le véhicule sélectionné
  useEffect(() => {
    if (selectedVehicle) {
      setSelectedBrand(selectedVehicle.brand);
      setBrandQuery(selectedVehicle.brand);
      setModelQuery(`${selectedVehicle.brand} ${selectedVehicle.model}`);
    }
  }, [selectedVehicle]);

  return (
    <div ref={wrapperRef} className={cn('space-y-4', className)}>
      {/* Champ Marque */}
      <div className="relative">
        <label htmlFor="brand" className="block text-sm font-medium text-text mb-2">
          Marque *
        </label>
        <div className="relative">
          <Input
            id="brand"
            value={brandQuery}
            onChange={(e) => {
              setBrandQuery(e.target.value);
              setSelectedBrand('');
              setModelQuery('');
              setModels([]);
            }}
            onFocus={() => {
              if (brands.length > 0) setShowBrandsDropdown(true);
            }}
            placeholder="Rechercher une marque (ex: Peugeot, Renault...)"
            disabled={!!selectedVehicle}
          />
          {isLoadingBrands && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-text-muted" />
          )}
        </div>

        {/* Dropdown Marques */}
        {showBrandsDropdown && brands.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
            <div className="p-2">
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandSelect(brand)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-background transition-colors text-text"
                >
                  {brand}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Champ Modèle */}
      {selectedBrand && (
        <div className="relative">
          <label htmlFor="model" className="block text-sm font-medium text-text mb-2">
            Modèle *
          </label>
          <div className="relative">
            <Input
              id="model"
              value={modelQuery}
              onChange={(e) => setModelQuery(e.target.value)}
              onFocus={() => {
                if (models.length > 0) setShowModelsDropdown(true);
              }}
              placeholder="Rechercher un modèle (ex: 208, Clio...)"
              disabled={!!selectedVehicle}
            />
            {isLoadingModels && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-text-muted" />
            )}
          </div>

          {/* Dropdown Modèles */}
          {showModelsDropdown && models.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
              <div className="p-2">
                {models.map((vehicle, index) => (
                  <button
                    key={`${vehicle.brand}-${vehicle.model}-${index}`}
                    type="button"
                    onClick={() => handleModelSelect(vehicle)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-text">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-text-muted">
                          {vehicle.years[0]}-{vehicle.years[1]} • {vehicle.horsepower[0]}-{vehicle.horsepower[1]} CV • {vehicle.fuel.join(', ')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}



