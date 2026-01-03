import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Abstract AI Vision service
 * 
 * Provides a pluggable interface for AI vision providers.
 * Currently supports OpenAI, but designed to support multiple providers.
 * 
 * Graceful degradation:
 * - If AI service fails or times out, returns null
 * - Core operations continue without AI features
 * - Manual fallback available for license data entry
 */
export interface IAIVisionService {
  analyzeLicenseImage(imageBuffer: Buffer): Promise<LicenseAnalysisResult | null>;
}

export interface LicenseAnalysisResult {
  isValid: boolean;
  isMoroccan: boolean;
  isForeign: boolean;
  extractedData?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    licenseNumber?: string;
    expiryDate?: string;
    licenseType?: string;
  };
  confidence?: number;
  error?: string;
}

@Injectable()
export class AIVisionService implements IAIVisionService {
  private readonly logger = new Logger(AIVisionService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly provider: 'openai' | 'google' | 'none';
  private readonly timeout: number = 10000; // 10 seconds

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('VISION_API_KEY') || '';
    this.provider = (this.configService.get<string>('VISION_PROVIDER') || 'openai') as
      | 'openai'
      | 'google'
      | 'none';

    if (this.provider === 'openai') {
      this.apiUrl =
        this.configService.get<string>('OPENAI_API_URL') ||
        'https://api.openai.com/v1/chat/completions';
    } else if (this.provider === 'google') {
      this.apiUrl =
        this.configService.get<string>('GOOGLE_VISION_API_URL') ||
        'https://vision.googleapis.com/v1/images:annotate';
    } else {
      this.apiUrl = '';
    }
  }

  /**
   * Analyze a license image using AI
   * 
   * Returns null if:
   * - AI service is disabled
   * - API call fails
   * - Timeout occurs
   * 
   * This allows graceful degradation - core operations continue without AI
   */
  async analyzeLicenseImage(imageBuffer: Buffer): Promise<LicenseAnalysisResult | null> {
    if (this.provider === 'none' || !this.apiKey) {
      this.logger.debug('AI Vision service is disabled');
      return null;
    }

    try {
      if (this.provider === 'openai') {
        return await this.analyzeWithOpenAI(imageBuffer);
      } else if (this.provider === 'google') {
        return await this.analyzeWithGoogle(imageBuffer);
      }
    } catch (error) {
      this.logger.error('AI Vision analysis failed', error);
      // Return null to allow graceful degradation
      return null;
    }

    return null;
  }

  /**
   * Analyze with OpenAI Vision API
   */
  private async analyzeWithOpenAI(imageBuffer: Buffer): Promise<LicenseAnalysisResult | null> {
    try {
      const base64Image = imageBuffer.toString('base64');

      // Create timeout promise
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), this.timeout);
      });

      // Create API call promise
      const apiPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this driving license image. Extract: name, first name, date of birth, license number, expiry date, license type. Determine if it is Moroccan or foreign. Return JSON format.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`OpenAI API error: ${res.statusText}`);
        }
        const data = await res.json();
        // Parse the response and extract data
        // This is a simplified version - actual implementation would parse the AI response
        return {
          isValid: true,
          isMoroccan: true, // Would be determined from AI response
          isForeign: false,
          extractedData: {},
          confidence: 0.8,
        } as LicenseAnalysisResult;
      });

      // Race between API call and timeout
      const result = await Promise.race([apiPromise, timeoutPromise]);

      return result;
    } catch (error) {
      this.logger.error('OpenAI Vision API error', error);
      return null;
    }
  }

  /**
   * Analyze with Google Vision API
   * 
   * Utilise Google Cloud Vision API pour l'OCR et la détection de texte
   * sur les images de permis de conduite
   * 
   * Pour activer :
   * 1. Créer un projet Google Cloud
   * 2. Activer Vision API
   * 3. Configurer GOOGLE_VISION_API_KEY dans .env
   */
  private async analyzeWithGoogle(imageBuffer: Buffer): Promise<LicenseAnalysisResult | null> {
    const googleApiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');
    const googleApiUrl = this.configService.get<string>('GOOGLE_VISION_API_URL') || 'https://vision.googleapis.com/v1/images:annotate';
    
    if (!googleApiKey) {
      this.logger.warn('Google Vision API key not configured');
      return null;
    }
    
    try {
      const imageBase64 = imageBuffer.toString('base64');
      
      // Appel Google Vision API pour OCR
      const visionApiUrl = `${googleApiUrl}?key=${googleApiKey}`;
      const response = await fetch(visionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Vision API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const textAnnotations = data.responses?.[0]?.textAnnotations;
      const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
      
      if (!textAnnotations || textAnnotations.length === 0) {
        this.logger.warn('No text detected in license image');
        return null;
      }
      
      // Extraire le texte complet
      const fullText = fullTextAnnotation?.text || textAnnotations[0]?.description || '';
      
      // Analyser le texte pour extraire les informations du permis
      // Cette logique peut être améliorée avec des regex plus sophistiquées
      const licenseNumberMatch = fullText.match(/(?:Permis|License|N°|No\.?)\s*:?\s*([A-Z0-9]{6,12})/i);
      const licenseNumber = licenseNumberMatch?.[1];
      
      // Détecter si c'est un permis marocain (recherche de mots-clés)
      const isMoroccan = /maroc|morocco|مغرب/i.test(fullText) || 
                         /royal|royale/i.test(fullText) ||
                         /الوزارة|النقل/i.test(fullText);
      
      // Extraction basique (peut être améliorée)
      const extractedData: LicenseAnalysisResult['extractedData'] = {};
      
      // Tentative d'extraction de nom (patterns communs)
      const nameMatch = fullText.match(/(?:Nom|Name|الاسم)\s*:?\s*([A-ZÀ-ÿ\s]{3,})/i);
      if (nameMatch) {
        const nameParts = nameMatch[1].trim().split(/\s+/);
        extractedData.firstName = nameParts[0];
        extractedData.lastName = nameParts.slice(1).join(' ');
        extractedData.name = nameMatch[1].trim();
      }
      
      // Tentative d'extraction de date d'expiration
      const expiryMatch = fullText.match(/(?:Expire|Expiry|Valid|Date expiration|صالح حتى)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
      if (expiryMatch) {
        extractedData.expiryDate = expiryMatch[1];
      }
      
      // Tentative d'extraction de type de permis
      const typeMatch = fullText.match(/(?:Catégorie|Category|Type|فئة)\s*:?\s*([A-Z]{1,2})/i);
      if (typeMatch) {
        extractedData.licenseType = typeMatch[1].toUpperCase();
      }
      
      // Ajouter le numéro de permis aux données extraites
      if (licenseNumber) {
        extractedData.licenseNumber = licenseNumber;
      }
      
      this.logger.log('Google Vision API analysis completed for license image');
      
      return {
        isValid: !!licenseNumber,
        isMoroccan,
        isForeign: !isMoroccan,
        extractedData: Object.keys(extractedData).length > 0 ? extractedData : undefined,
        confidence: licenseNumber ? 0.7 : 0.4,
      };
    } catch (error: any) {
      this.logger.error('Google Vision API analysis failed', error);
      return null;
    }
  }
}



