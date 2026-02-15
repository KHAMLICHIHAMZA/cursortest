'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Card } from './card';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { cn } from '@/lib/utils/cn';

// Liste des couleurs communes pour véhicules
const COMMON_COLORS = [
  'Blanc',
  'Noir',
  'Gris',
  'Argent',
  'Rouge',
  'Bleu',
  'Vert',
  'Jaune',
  'Orange',
  'Marron',
  'Beige',
  'Bordeaux',
  'Violet',
  'Rose',
  'Turquoise',
  'Or',
  'Cuivre',
  'Bronze',
  'Gris clair',
  'Gris foncé',
  'Bleu foncé',
  'Bleu clair',
  'Rouge foncé',
  'Rouge clair',
  'Vert foncé',
  'Vert clair',
  'Blanc nacré',
  'Noir mat',
  'Gris métallisé',
  'Argent métallisé',
];

// Fonction pour obtenir la couleur CSS correspondante à un nom de couleur
function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    'Blanc': '#FFFFFF',
    'Noir': '#000000',
    'Gris': '#808080',
    'Argent': '#C0C0C0',
    'Rouge': '#FF0000',
    'Bleu': '#0000FF',
    'Vert': '#008000',
    'Jaune': '#FFFF00',
    'Orange': '#FFA500',
    'Marron': '#8B4513',
    'Beige': '#F5F5DC',
    'Bordeaux': '#800020',
    'Violet': '#800080',
    'Rose': '#FFC0CB',
    'Turquoise': '#40E0D0',
    'Or': '#FFD700',
    'Cuivre': '#B87333',
    'Bronze': '#CD7F32',
    'Gris clair': '#D3D3D3',
    'Gris foncé': '#505050',
    'Bleu foncé': '#00008B',
    'Bleu clair': '#87CEEB',
    'Rouge foncé': '#8B0000',
    'Rouge clair': '#FF6B6B',
    'Vert foncé': '#006400',
    'Vert clair': '#90EE90',
    'Blanc nacré': '#F8F8FF',
    'Noir mat': '#1C1C1C',
    'Gris métallisé': '#A9A9A9',
    'Argent métallisé': '#D3D3D3',
  };
  
  return colorMap[colorName] || '#808080'; // Par défaut gris si non trouvé
}

// Fonction pour déterminer si le texte doit être en blanc ou noir selon la luminosité
function getTextColor(backgroundColor: string): string {
  // Convertir hex en RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculer la luminosité relative
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retourner blanc si sombre, noir si clair
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

interface ColorAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export function ColorAutocomplete({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Rechercher une couleur (ex: Blanc, Noir...)',
  className,
  disabled,
  id,
  name,
}: ColorAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  const debouncedQuery = useDebounce(query, 200);

  // Filtrer les couleurs selon la recherche
  useEffect(() => {
    // Ne pas réouvrir le dropdown juste après une sélection
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debouncedQuery.length >= 1) {
      const filtered = COMMON_COLORS.filter((color) =>
        color.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 10));
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [debouncedQuery]);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (color: string) => {
    justSelectedRef.current = true;
    setQuery(color);
    onChange(color);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <Input
        id={id}
        name={name}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Dropdown Suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
          <div className="p-2 space-y-1">
            {suggestions.map((color) => {
              const bgColor = getColorValue(color);
              const textColor = getTextColor(bgColor);
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelect(color)}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-all hover:opacity-90 hover:shadow-md font-medium"
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    border: `1px solid ${textColor === '#FFFFFF' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'}`,
                  }}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

