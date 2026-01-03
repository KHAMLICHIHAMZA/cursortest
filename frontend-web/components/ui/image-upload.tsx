'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from './toast';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null, previewUrl?: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, className, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser la preview avec la valeur externe
  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    console.log('Validating image file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    });

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Format non supporté: ${file.type}. Formats acceptés: JPG, PNG, GIF, WEBP`,
      };
    }

    // Vérifier l'extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Extension non supportée: .${extension}. Extensions acceptées: .jpg, .jpeg, .png, .gif, .webp`,
      };
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Fichier trop volumineux: ${sizeMB}MB. Taille maximale: 5MB`,
      };
    }

    // Vérifier que le fichier n'est pas vide
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Le fichier est vide',
      };
    }

    return { valid: true };
  };

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, file.type, file.size);

    // Valider le fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error('Image validation failed:', validation.error);
      toast.error(validation.error || 'Fichier invalide');
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log('Image validation passed, creating preview...');

    const reader = new FileReader();
    reader.onerror = () => {
      console.error('Error reading file');
      toast.error('Erreur lors de la lecture du fichier');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onloadend = () => {
      try {
        const previewUrl = reader.result as string;
        console.log('Preview created successfully, size:', previewUrl.length);
        setPreview(previewUrl);
        onChange(file, previewUrl);
      } catch (error) {
        console.error('Error creating preview:', error);
        toast.error('Erreur lors de la création de la prévisualisation');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-text mb-2">
        Photo du véhicule
      </label>

      {preview ? (
        <Card className="relative p-4">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Prévisualisation"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-error text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors',
            isDragging && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer hover:border-primary/50',
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          <ImageIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text mb-2">
            Glissez-déposez une image ou{' '}
            <span className="text-primary font-medium">cliquez pour sélectionner</span>
          </p>
          <p className="text-sm text-text-muted">
            JPG, PNG, GIF ou WEBP (max. 5MB)
          </p>
        </div>
      )}
    </div>
  );
}


