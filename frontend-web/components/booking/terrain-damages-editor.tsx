'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { uploadApi } from '@/lib/api/upload';
import type { TerrainDamagePayload } from '@/lib/api/booking';
import { toast } from '@/components/ui/toast';
import { BackendImage } from '@/components/ui/backend-image';
import {
  TERRAIN_DAMAGE_ZONES,
  TERRAIN_DAMAGE_TYPES,
  TERRAIN_DAMAGE_SEVERITIES,
} from '@/lib/api/booking';

type Props = {
  title: string;
  description: string;
  value: TerrainDamagePayload[];
  onChange: (next: TerrainDamagePayload[]) => void;
};

export function TerrainDamagesEditor({ title, description, value, onChange }: Props) {
  const addRow = () => {
    onChange([
      ...value,
      {
        zone: 'FRONT',
        type: 'SCRATCH',
        severity: 'LOW',
        description: '',
        photos: [],
      },
    ]);
  };

  const updateRow = (index: number, patch: Partial<TerrainDamagePayload>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      const { url } = await uploadApi.uploadFile(file);
      const row = value[index];
      updateRow(index, { photos: [...row.photos, url] });
      toast.success('Photo ajoutée au dommage');
    } catch {
      toast.error('Échec du téléchargement');
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      {value.map((row, index) => (
        <div
          key={index}
          className="rounded-md border border-border bg-background/50 p-3 space-y-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-text-muted">Zone</label>
              <Select
                value={row.zone}
                onChange={(e) =>
                  updateRow(index, { zone: e.target.value as TerrainDamagePayload['zone'] })
                }
              >
                {TERRAIN_DAMAGE_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-text-muted">Type</label>
              <Select
                value={row.type}
                onChange={(e) =>
                  updateRow(index, { type: e.target.value as TerrainDamagePayload['type'] })
                }
              >
                {TERRAIN_DAMAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-text-muted">Gravité</label>
              <Select
                value={row.severity}
                onChange={(e) =>
                  updateRow(index, {
                    severity: e.target.value as TerrainDamagePayload['severity'],
                  })
                }
              >
                {TERRAIN_DAMAGE_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-text-muted">Description (optionnel)</label>
            <Input
              value={row.description || ''}
              onChange={(e) => updateRow(index, { description: e.target.value })}
              maxLength={400}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-muted block mb-1">
              Photos du dommage (au moins 1 requise pour enregistrer ce dommage)
            </label>
            <Input
              type="file"
              accept="image/*"
              data-testid={`terrain-damage-photo-${index}`}
              onChange={(e) => uploadPhoto(index, e.target.files?.[0] || null)}
            />
            {row.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {row.photos.map((u) => (
                  <BackendImage
                    key={u}
                    imageUrl={u}
                    alt="dégât"
                    className="w-16 h-16 object-cover rounded"
                    placeholderClassName="w-16 h-16 rounded"
                  />
                ))}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid={`terrain-damage-remove-${index}`}
            onClick={() => removeRow(index)}
          >
            Retirer ce dommage
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" data-testid="terrain-damage-add" onClick={addRow}>
        + Ajouter un dommage
      </Button>
    </div>
  );
}
