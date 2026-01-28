import { useState, useEffect, useRef } from 'react';

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

// Hook simple pour debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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

export default function ColorAutocomplete({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Rechercher une couleur (ex: Blanc, Noir...)',
  className = '',
  disabled = false,
  id,
  name,
}: ColorAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 200);

  // Filtrer les couleurs selon la recherche
  useEffect(() => {
    const filtered = debouncedQuery.length >= 1
      ? COMMON_COLORS.filter((color) =>
          color.toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
      : COMMON_COLORS;
    setSuggestions(filtered.slice(0, 10)); // Limiter à 10 résultats
    setShowDropdown(isFocused && filtered.length > 0);
  }, [debouncedQuery, isFocused]);

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
    setQuery(color);
    onChange(color);
    setShowDropdown(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    const filtered = query.length >= 1
      ? COMMON_COLORS.filter((color) =>
          color.toLowerCase().includes(query.toLowerCase()),
        )
      : COMMON_COLORS;
    setSuggestions(filtered.slice(0, 10));
    setShowDropdown(filtered.length > 0);
  };
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
    setTimeout(() => setShowDropdown(false), 100);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#3E7BFA] disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Dropdown Suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[#2C2F36] border border-gray-600 rounded-lg shadow-xl">
          <div className="p-2 space-y-1">
            {suggestions.map((color) => {
              const bgColor = getColorValue(color);
              const textColor = getTextColor(bgColor);
              
              return (
                <button
                  key={color}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(color);
                  }}
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
        </div>
      )}
    </div>
  );
}




