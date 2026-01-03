import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null, previewUrl?: string) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  className = '', 
  disabled = false,
  label = 'Photo'
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Format non supporté: ${file.type}. Formats acceptés: JPG, PNG, GIF, WEBP`,
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Fichier trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 5MB`,
      };
    }

    return { valid: true };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Fichier invalide');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onloadend = () => {
      try {
        const previewUrl = reader.result as string;
        setPreview(previewUrl);
        onChange(file, previewUrl);
      } catch (error) {
        alert('Erreur lors de la création de la prévisualisation');
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
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      {preview ? (
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
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-[#3E7BFA] bg-[#3E7BFA]/10'
              : 'border-gray-600 hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">
            Glissez-déposez une image ici ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, GIF ou WEBP (max 5MB)
          </p>
        </div>
      )}
    </div>
  );
}




