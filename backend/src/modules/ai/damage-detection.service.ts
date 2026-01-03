import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * DamageDetectionService - Détection automatique de dommages via IA Vision
 * 
 * Supporte:
 * - OpenAI Vision API (GPT-4 Vision)
 * - Google Cloud Vision API
 * 
 * Règles :
 * - Déclenchée automatiquement à chaque check-out
 * - Non bloquante
 * - Zones suspectes visibles
 * - Message simple
 * - Décision toujours humaine
 */
@Injectable()
export class DamageDetectionService {
  private readonly logger = new Logger(DamageDetectionService.name);
  private visionApiKey: string;
  private visionApiUrl: string;
  private visionProvider: 'openai' | 'google' | 'none';
  private enabled: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.visionApiKey = this.configService.get<string>('VISION_API_KEY') || '';
    this.visionProvider = (this.configService.get<string>('VISION_PROVIDER') || 'openai') as 'openai' | 'google' | 'none';
    
    if (this.visionProvider === 'openai') {
      this.visionApiUrl = this.configService.get<string>('OPENAI_API_URL') || 'https://api.openai.com/v1/chat/completions';
    } else if (this.visionProvider === 'google') {
      this.visionApiUrl = this.configService.get<string>('GOOGLE_VISION_API_URL') || 'https://vision.googleapis.com/v1/images:annotate';
    } else {
      this.visionApiUrl = '';
    }

    this.enabled = !!this.visionApiKey && this.visionProvider !== 'none';

    if (!this.enabled) {
      this.logger.warn('Vision API non configurée - La détection de dommages sera désactivée');
    }
  }

  /**
   * Analyser une image pour détecter des dommages
   */
  async detectDamage(
    imageUrl: string,
    vehicleId: string,
    bookingId: string,
  ): Promise<{
    hasDamage: boolean;
    confidence: number;
    suspiciousZones: Array<{ x: number; y: number; width: number; height: number; description: string }>;
    message: string;
  }> {
    if (!this.enabled) {
      return {
        hasDamage: false,
        confidence: 0,
        suspiciousZones: [],
        message: 'IA non configurée - Vérification manuelle requise',
      };
    }

    try {
      if (this.visionProvider === 'openai') {
        return await this.detectDamageWithOpenAI(imageUrl, vehicleId, bookingId);
      } else if (this.visionProvider === 'google') {
        return await this.detectDamageWithGoogle(imageUrl, vehicleId, bookingId);
      } else {
        throw new Error('Vision provider not configured');
      }
    } catch (error: any) {
      this.logger.error('Damage detection error:', error);
      
      // En cas d'erreur, retourner neutre (non bloquant)
      return {
        hasDamage: false,
        confidence: 0,
        suspiciousZones: [],
        message: 'Erreur lors de l\'analyse - Vérification manuelle requise',
      };
    }
  }

  /**
   * Détection avec OpenAI Vision API
   */
  private async detectDamageWithOpenAI(
    imageUrl: string,
    vehicleId: string,
    bookingId: string,
  ): Promise<{
    hasDamage: boolean;
    confidence: number;
    suspiciousZones: Array<{ x: number; y: number; width: number; height: number; description: string }>;
    message: string;
  }> {
    const response = await fetch(this.visionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.visionApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyse cette photo de véhicule et détecte s\'il y a des dommages, rayures, bosses ou autres anomalies. Réponds UNIQUEMENT en JSON valide avec cette structure: {"hasDamage": boolean, "confidence": 0-1, "suspiciousZones": [{"x": number, "y": number, "width": number, "height": number, "description": string}], "message": string}.',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parser la réponse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      hasDamage: analysis.hasDamage || false,
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0)),
      suspiciousZones: analysis.suspiciousZones || [],
      message: analysis.message || 'Analyse terminée',
    };
  }

  /**
   * Détection avec Google Cloud Vision API
   * 
   * Implémentation Google Vision API avec fallback gracieux :
   * - Si credentials Google Cloud sont configurés : utilise Google Vision API
   * - Sinon : fallback sur OpenAI Vision API
   * 
   * Pour activer Google Vision API :
   * 1. Créer un projet Google Cloud
   * 2. Activer Vision API
   * 3. Créer une clé API ou service account
   * 4. Configurer GOOGLE_VISION_API_KEY dans .env
   */
  private async detectDamageWithGoogle(
    imageUrl: string,
    vehicleId: string,
    bookingId: string,
  ): Promise<{
    hasDamage: boolean;
    confidence: number;
    suspiciousZones: Array<{ x: number; y: number; width: number; height: number; description: string }>;
    message: string;
  }> {
    const googleApiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');
    const googleApiUrl = this.configService.get<string>('GOOGLE_VISION_API_URL') || 'https://vision.googleapis.com/v1/images:annotate';
    
    // Si pas de clé API Google, utiliser OpenAI comme fallback
    if (!googleApiKey) {
      this.logger.warn('Google Vision API key not configured, using OpenAI as fallback');
      return this.detectDamageWithOpenAI(imageUrl, vehicleId, bookingId);
    }
    
    try {
      // Télécharger l'image depuis l'URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      // Appel Google Vision API
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
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 10,
                },
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10,
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
      const responses = data.responses?.[0];
      
      if (!responses) {
        throw new Error('No response from Google Vision API');
      }
      
      // Analyser les résultats pour détecter des dommages
      const labels = responses.labelAnnotations || [];
      const objects = responses.localizedObjectAnnotations || [];
      
      // Rechercher des labels indiquant des dommages
      const damageKeywords = ['damage', 'scratch', 'dent', 'crack', 'broken', 'wreck', 'collision'];
      const damageLabels = labels.filter((label: any) =>
        damageKeywords.some(keyword => label.description?.toLowerCase().includes(keyword))
      );
      
      // Calculer la confiance basée sur les labels de dommage
      const hasDamage = damageLabels.length > 0 || objects.length > 0;
      const confidence = damageLabels.length > 0 
        ? Math.min(0.9, 0.5 + (damageLabels.length * 0.1))
        : 0.3;
      
      // Extraire les zones suspectes depuis les objets détectés
      const suspiciousZones = objects.slice(0, 5).map((obj: any, index: number) => ({
        x: Math.round((obj.boundingPoly?.normalizedVertices?.[0]?.x || 0) * 100),
        y: Math.round((obj.boundingPoly?.normalizedVertices?.[0]?.y || 0) * 100),
        width: Math.round(((obj.boundingPoly?.normalizedVertices?.[2]?.x || 0) - (obj.boundingPoly?.normalizedVertices?.[0]?.x || 0)) * 100),
        height: Math.round(((obj.boundingPoly?.normalizedVertices?.[2]?.y || 0) - (obj.boundingPoly?.normalizedVertices?.[0]?.y || 0)) * 100),
        description: obj.name || `Zone suspecte ${index + 1}`,
      }));
      
      const message = hasDamage
        ? `Dommages détectés: ${damageLabels.map((l: any) => l.description).join(', ')}`
        : 'Aucun dommage évident détecté';
      
      this.logger.log(`Google Vision API analysis completed: ${hasDamage ? 'Damage detected' : 'No damage'}`);
      
      return {
        hasDamage,
        confidence,
        suspiciousZones,
        message,
      };
    } catch (error: any) {
      // En cas d'erreur, utiliser OpenAI comme fallback
      this.logger.warn(`Google Vision API error, using OpenAI as fallback: ${error.message}`);
      return this.detectDamageWithOpenAI(imageUrl, vehicleId, bookingId);
    }
  }

  /**
   * Analyser plusieurs images (check-out complet)
   */
  async detectDamageBatch(
    imageUrls: string[],
    vehicleId: string,
    bookingId: string,
  ): Promise<{
    overallHasDamage: boolean;
    maxConfidence: number;
    allSuspiciousZones: Array<{ imageIndex: number; zones: any[] }>;
    summary: string;
  }> {
    const results = await Promise.all(
      imageUrls.map((url, index) =>
        this.detectDamage(url, vehicleId, bookingId).then((result) => ({
          index,
          ...result,
        })),
      ),
    );

    const overallHasDamage = results.some((r) => r.hasDamage);
    const maxConfidence = Math.max(...results.map((r) => r.confidence), 0);
    const allSuspiciousZones = results
      .filter((r) => r.suspiciousZones.length > 0)
      .map((r) => ({
        imageIndex: r.index,
        zones: r.suspiciousZones,
      }));

    const summary = overallHasDamage
      ? `${results.filter((r) => r.hasDamage).length} image(s) présentent des anomalies suspectes`
      : 'Aucun dommage détecté automatiquement';

    return {
      overallHasDamage,
      maxConfidence,
      allSuspiciousZones,
      summary,
    };
  }
}
