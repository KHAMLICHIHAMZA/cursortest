import { useState, useEffect, useRef } from 'react';

// Liste des pays du monde
const COUNTRIES = [
  'Maroc',
  'Algérie',
  'Tunisie',
  'Égypte',
  'France',
  'Espagne',
  'Italie',
  'Allemagne',
  'Belgique',
  'Suisse',
  'Canada',
  'États-Unis',
  'Royaume-Uni',
  'Portugal',
  'Pays-Bas',
  'Turquie',
  'Sénégal',
  'Côte d\'Ivoire',
  'Mali',
  'Burkina Faso',
  'Niger',
  'Tchad',
  'Mauritanie',
  'Guinée',
  'Cameroun',
  'Gabon',
  'Congo',
  'RDC',
  'Madagascar',
  'Maurice',
  'Seychelles',
  'Comores',
  'Djibouti',
  'Éthiopie',
  'Kenya',
  'Tanzanie',
  'Ouganda',
  'Rwanda',
  'Burundi',
  'Ghana',
  'Nigeria',
  'Bénin',
  'Togo',
  'Gambie',
  'Guinée-Bissau',
  'Sierra Leone',
  'Libéria',
  'Cap-Vert',
  'São Tomé-et-Príncipe',
  'Guinée équatoriale',
  'Angola',
  'Mozambique',
  'Zimbabwe',
  'Zambie',
  'Malawi',
  'Botswana',
  'Namibie',
  'Afrique du Sud',
  'Lesotho',
  'Eswatini',
  'Chine',
  'Japon',
  'Corée du Sud',
  'Inde',
  'Pakistan',
  'Bangladesh',
  'Thaïlande',
  'Vietnam',
  'Indonésie',
  'Malaisie',
  'Singapour',
  'Philippines',
  'Australie',
  'Nouvelle-Zélande',
  'Brésil',
  'Argentine',
  'Chili',
  'Colombie',
  'Pérou',
  'Venezuela',
  'Équateur',
  'Uruguay',
  'Paraguay',
  'Bolivie',
  'Mexique',
  'Cuba',
  'République dominicaine',
  'Haïti',
  'Jamaïque',
  'Trinité-et-Tobago',
  'Barbade',
  'Bahamas',
  'Panama',
  'Costa Rica',
  'Guatemala',
  'Honduras',
  'Nicaragua',
  'El Salvador',
  'Belize',
  'Russie',
  'Ukraine',
  'Pologne',
  'Roumanie',
  'Bulgarie',
  'Grèce',
  'Croatie',
  'Serbie',
  'Bosnie-Herzégovine',
  'Albanie',
  'Macédoine',
  'Monténégro',
  'Kosovo',
  'Slovénie',
  'Slovaquie',
  'République tchèque',
  'Hongrie',
  'Autriche',
  'Suède',
  'Norvège',
  'Danemark',
  'Finlande',
  'Islande',
  'Irlande',
  'Luxembourg',
  'Monaco',
  'Andorre',
  'Liechtenstein',
  'Malte',
  'Chypre',
  'Israël',
  'Palestine',
  'Jordanie',
  'Liban',
  'Syrie',
  'Irak',
  'Iran',
  'Arabie saoudite',
  'Émirats arabes unis',
  'Qatar',
  'Koweït',
  'Bahreïn',
  'Oman',
  'Yémen',
  'Afghanistan',
  'Ouzbékistan',
  'Kazakhstan',
  'Kirghizistan',
  'Tadjikistan',
  'Turkménistan',
  'Mongolie',
  'Népal',
  'Bhoutan',
  'Sri Lanka',
  'Maldives',
  'Myanmar',
  'Laos',
  'Cambodge',
  'Brunei',
  'Timor oriental',
  'Papouasie-Nouvelle-Guinée',
  'Fidji',
  'Samoa',
  'Tonga',
  'Vanuatu',
  'Nouvelle-Calédonie',
  'Polynésie française',
  'Autre',
];

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

interface CountryAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export default function CountryAutocomplete({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Rechercher un pays...',
  className = '',
  disabled = false,
  id,
  name,
}: CountryAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 200);

  // Filtrer les pays selon la recherche
  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      const filtered = COUNTRIES.filter((country) =>
        country.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 15)); // Limiter à 15 résultats
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

  const handleSelect = (country: string) => {
    setQuery(country);
    onChange(country);
    setShowDropdown(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleFocus = () => {
    if (query.length >= 1) {
      const filtered = COUNTRIES.filter((country) =>
        country.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 15));
      setShowDropdown(true);
    } else {
      // Afficher les premiers pays par défaut
      setSuggestions(COUNTRIES.slice(0, 15));
      setShowDropdown(true);
    }
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
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full px-4 py-2 bg-[#1D1F23] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#3E7BFA] disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Dropdown Suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[#2C2F36] border border-gray-600 rounded-lg shadow-xl">
          <div className="p-2 space-y-1">
            {suggestions.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => handleSelect(country)}
                className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-[#3E7BFA] hover:text-white text-gray-300"
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




