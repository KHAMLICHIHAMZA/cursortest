import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

// Import conditionnel de SignatureCanvas (ne fonctionne pas sur web car utilise WebView)
// Le module-resolver dans babel.config.js redirige react-native-webview vers un stub sur web
let SignatureCanvas: any = null;
if (Platform.OS !== 'web') {
  try {
    SignatureCanvas = require('react-native-signature-canvas').default;
  } catch (e) {
    // Silently fail - WebView not available
    console.warn('react-native-signature-canvas not available:', e);
    SignatureCanvas = null;
  }
}

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  label,
  required = false,
  error,
}) => {
  const { t } = useTranslation();
  const signatureRef = useRef<any>(null);

  // Sur web, définir une signature vide par défaut pour permettre la validation
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Si le champ n'est pas requis, on peut laisser vide
      if (!required) {
        onSignatureChange('');
      }
    }
  }, [required, onSignatureChange]);

  const handleOK = (signature: string) => {
    onSignatureChange(signature);
  };

  const handleClear = () => {
    if (Platform.OS === 'web') {
      onSignatureChange('');
    } else {
      signatureRef.current?.clearSignature();
      onSignatureChange('');
    }
  };

  const handleConfirm = () => {
    if (Platform.OS === 'web') {
      // Sur web, on ne peut pas capturer de signature
      // On accepte une signature vide si le champ n'est pas requis
      if (!required) {
        onSignatureChange('');
      }
    } else {
      signatureRef.current?.readSignature();
    }
  };

  // Fallback pour web : afficher un message informatif
  if (Platform.OS === 'web' || !SignatureCanvas) {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        <View style={styles.webFallbackContainer}>
          <Text style={styles.webFallbackText}>
            {t('common.signatureNotAvailable') || 'Signature pad not available on web. Please use mobile app.'}
          </Text>
          <Text style={styles.webFallbackNote}>
            {t('common.useMobileApp') || 'For signature capture, please use the mobile app.'}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleOK}
          descriptionText={t('common.signHere') || 'Sign here'}
          clearText={t('common.clear') || 'Clear'}
          confirmText={t('common.confirm') || 'Confirm'}
          webStyle={webStyle}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>{t('common.clear')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const webStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: 1px solid #DDD;
    border-radius: 8px;
  }
`;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  required: {
    color: '#FF3B30',
  },
  signatureContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  webFallbackContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  webFallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  webFallbackNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

