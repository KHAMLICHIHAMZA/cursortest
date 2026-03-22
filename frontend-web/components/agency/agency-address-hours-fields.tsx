'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type AgencyAddressDetails = {
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
};

export type AgencyOpeningHours = Record<
  string,
  {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }
>;

export function hasInvalidOpeningHours(openingHours?: AgencyOpeningHours): boolean {
  if (!openingHours) return false;
  return Object.values(openingHours).some((value) => {
    if (!value?.isOpen) return false;
    if (!value.openTime || !value.closeTime) return true;
    return value.closeTime <= value.openTime;
  });
}

const WEEK_DAYS: Array<{ key: string; label: string }> = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export function createDefaultOpeningHours(): AgencyOpeningHours {
  return {
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    saturday: { isOpen: false },
    sunday: { isOpen: false },
  };
}

type Props = {
  addressDetails: AgencyAddressDetails;
  onAddressDetailsChange: (next: AgencyAddressDetails) => void;
  openingHours: AgencyOpeningHours;
  onOpeningHoursChange: (next: AgencyOpeningHours) => void;
};

export function AgencyAddressHoursFields({
  addressDetails,
  onAddressDetailsChange,
  openingHours,
  onOpeningHoursChange,
}: Props) {
  const applyWeekdayTemplate = () => {
    const monday = openingHours.monday || { isOpen: true, openTime: '09:00', closeTime: '18:00' };
    const next = { ...openingHours };
    ['tuesday', 'wednesday', 'thursday', 'friday'].forEach((key) => {
      next[key] = { ...monday };
    });
    onOpeningHoursChange(next);
  };

  const setBusinessHoursPreset = () => {
    onOpeningHoursChange({
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '13:00' },
      sunday: { isOpen: false },
    });
  };

  const closeAllDays = () => {
    const next: AgencyOpeningHours = {};
    WEEK_DAYS.forEach((day) => {
      next[day.key] = { isOpen: false };
    });
    onOpeningHoursChange(next);
  };

  return (
    <>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text">Adresse structurée</label>
        <Input
          value={addressDetails.line1 || ''}
          onChange={(e) => onAddressDetailsChange({ ...addressDetails, line1: e.target.value })}
          placeholder="Ligne 1 (numéro, rue...)"
        />
        <Input
          value={addressDetails.line2 || ''}
          onChange={(e) => onAddressDetailsChange({ ...addressDetails, line2: e.target.value })}
          placeholder="Ligne 2 (bâtiment, quartier...)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            value={addressDetails.postalCode || ''}
            onChange={(e) => onAddressDetailsChange({ ...addressDetails, postalCode: e.target.value })}
            placeholder="Code postal"
          />
          <Input
            value={addressDetails.city || ''}
            onChange={(e) => onAddressDetailsChange({ ...addressDetails, city: e.target.value })}
            placeholder="Ville"
          />
          <Input
            value={addressDetails.country || ''}
            onChange={(e) => onAddressDetailsChange({ ...addressDetails, country: e.target.value })}
            placeholder="Pays"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-sm font-medium text-text">Horaires d&apos;ouverture hebdomadaires</label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={applyWeekdayTemplate}>
              Copier lundi → ven.
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={setBusinessHoursPreset}>
              Preset 9h-18h
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={closeAllDays}>
              Fermer tout
            </Button>
          </div>
        </div>

        <div className="space-y-2 border border-border rounded-lg p-3">
          {WEEK_DAYS.map((day) => {
            const value = openingHours[day.key] || { isOpen: false };
            const dayError = !value.isOpen
              ? ''
              : !value.openTime || !value.closeTime
                ? "Renseignez les heures d'ouverture et de fermeture."
                : value.closeTime <= value.openTime
                  ? "L'heure de fermeture doit être après l'ouverture."
                  : '';
            return (
              <div key={day.key} className="space-y-1">
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!value.isOpen}
                      onChange={(e) =>
                        onOpeningHoursChange({
                          ...openingHours,
                          [day.key]: e.target.checked
                            ? { isOpen: true, openTime: value.openTime || '09:00', closeTime: value.closeTime || '18:00' }
                            : { isOpen: false },
                        })
                      }
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text">{day.label}</span>
                  </div>
                  <Input
                    type="time"
                    value={value.openTime || ''}
                    disabled={!value.isOpen}
                    onChange={(e) =>
                      onOpeningHoursChange({
                        ...openingHours,
                        [day.key]: { ...value, isOpen: true, openTime: e.target.value },
                      })
                    }
                  />
                  <Input
                    type="time"
                    value={value.closeTime || ''}
                    disabled={!value.isOpen}
                    onChange={(e) =>
                      onOpeningHoursChange({
                        ...openingHours,
                        [day.key]: { ...value, isOpen: true, closeTime: e.target.value },
                      })
                    }
                  />
                  <span className="text-xs text-text-muted">
                    {value.isOpen ? `${value.openTime || '--:--'} - ${value.closeTime || '--:--'}` : 'Fermé'}
                  </span>
                </div>
                {dayError && <p className="text-xs text-red-500">{dayError}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

