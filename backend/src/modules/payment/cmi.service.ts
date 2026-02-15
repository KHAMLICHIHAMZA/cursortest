import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * CMI Service - Intégration CMI Maroc
 * Documentation: https://www.cmi.co.ma/
 * 
 * Configuration requise dans .env:
 * - CMI_MERCHANT_ID: ID du marchand CMI
 * - CMI_SECRET_KEY: Clé secrète CMI
 * - CMI_TEST_MODE: true/false (mode test)
 */
@Injectable()
export class CmiService {
  private readonly logger = new Logger(CmiService.name);
  private merchantId: string;
  private secretKey: string;
  private testMode: boolean;
  private baseUrl: string;
  private statusCheckUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>('CMI_MERCHANT_ID') || '';
    this.secretKey = this.configService.get<string>('CMI_SECRET_KEY') || '';
    this.testMode = this.configService.get<string>('CMI_TEST_MODE') === 'true';
    this.baseUrl = this.testMode
      ? 'https://testpayment.cmi.co.ma/fim/est3Dgate'
      : 'https://payment.cmi.co.ma/fim/est3Dgate';
    this.statusCheckUrl = this.testMode
      ? 'https://testpayment.cmi.co.ma/fim/api'
      : 'https://payment.cmi.co.ma/fim/api';

    if (!this.merchantId || !this.secretKey) {
      this.logger.warn('CMI non configuré - Les paiements en ligne seront désactivés');
    }
  }

  /**
   * Générer le hash de sécurité CMI
   */
  private generateHash(data: Record<string, any>): string {
    // Trier les clés par ordre alphabétique
    const sortedKeys = Object.keys(data).sort();
    const hashString = sortedKeys
      .map((key) => `${key}=${data[key]}`)
      .join('&');

    // Ajouter la clé secrète
    const fullHashString = `${hashString}${this.secretKey}`;

    // Générer le hash SHA256
    return crypto.createHash('sha256').update(fullHashString).digest('hex').toUpperCase();
  }

  /**
   * Créer une transaction de paiement
   */
  async createPaymentRequest(params: {
    amount: number;
    orderId: string;
    currency?: string;
    clientId: string;
    clientEmail?: string;
    clientName?: string;
    successUrl: string;
    failUrl: string;
    callbackUrl: string;
    language?: string;
  }): Promise<{ url: string; formData: Record<string, string> }> {
    if (!this.merchantId || !this.secretKey) {
      throw new BadRequestException('CMI non configuré');
    }

    const {
      amount,
      orderId,
      currency = '504', // MAD
      clientId,
      clientEmail = '',
      clientName = '',
      successUrl,
      failUrl,
      callbackUrl,
      language = 'fr',
    } = params;

    // Données de la transaction
    const paymentData: Record<string, any> = {
      storetype: '3D_PAY_HOSTING',
      trantype: 'PreAuth',
      amount: amount.toFixed(2),
      currency,
      oid: orderId,
      okUrl: successUrl,
      failUrl: failUrl,
      callbackUrl: callbackUrl,
      rnd: Date.now().toString(),
      hashAlgorithm: 'ver3',
      lang: language,
      email: clientEmail,
      BillToName: clientName || clientId,
      BillToCompany: '',
      BillToStreet1: '',
      BillToCity: '',
      BillToState: '',
      BillToPostalCode: '',
      BillToCountry: '504', // Maroc
    };

    // Générer le hash
    const hash = this.generateHash(paymentData);
    paymentData.hash = hash;

    return {
      url: this.baseUrl,
      formData: paymentData,
    };
  }

  /**
   * Générer l'URL de paiement CMI (pour redirection)
   */
  async generatePaymentUrl(params: {
    oid: string;
    amount: number;
    clientName?: string;
    clientEmail?: string;
    callbackUrl: string;
    returnUrl: string;
    failUrl: string;
  }): Promise<string> {
    const paymentRequest = await this.createPaymentRequest({
      amount: params.amount,
      orderId: params.oid,
      clientId: params.oid,
      clientEmail: params.clientEmail,
      clientName: params.clientName,
      successUrl: params.returnUrl,
      failUrl: params.failUrl,
      callbackUrl: params.callbackUrl,
    });

    // Construire l'URL avec les paramètres
    const queryParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(paymentRequest.formData).map(([k, v]) => [k, String(v)])
      )
    );

    return `${paymentRequest.url}?${queryParams.toString()}`;
  }

  /**
   * Vérifier la réponse CMI (callback/webhook)
   */
  async verifyCallback(data: Record<string, any>): Promise<{
    valid: boolean;
    transactionId: string;
    orderId: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    responseCode: string;
    responseMessage: string;
  }> {
    // Extraire le hash reçu
    const receivedHash = data.hash || data.Hash;
    const hashData = { ...data };
    delete hashData.hash;
    delete hashData.Hash;

    // Générer le hash attendu
    const expectedHash = this.generateHash(hashData);

    // Vérifier le hash
    if (receivedHash !== expectedHash) {
      this.logger.error('Invalid CMI hash signature', { receivedHash, expectedHash });
      throw new BadRequestException('Signature de hachage invalide');
    }

    const responseCode = data.Response || data.response || '';
    const isSuccess = responseCode === 'Approved' || responseCode === '00';

    return {
      valid: true,
      transactionId: data.TransId || data.transId || '',
      orderId: data.oid || data.OID || '',
      amount: parseFloat(data.amount || data.Amount || '0'),
      status: isSuccess ? 'success' : 'failed',
      responseCode,
      responseMessage: data.ResponseMessage || data.responseMessage || '',
    };
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async checkTransactionStatus(transactionId: string): Promise<{
    found: boolean;
    status?: 'success' | 'failed' | 'pending';
    amount?: number;
    orderId?: string;
    responseCode?: string;
    responseMessage?: string;
  }> {
    if (!this.merchantId || !this.secretKey) {
      this.logger.warn('CMI non configuré - Impossible de vérifier le statut');
      return { found: false };
    }

    try {
      // Appel API CMI pour vérifier le statut
      const checkData: Record<string, any> = {
        merchantId: this.merchantId,
        transactionId,
        rnd: Date.now().toString(),
      };

      const hash = this.generateHash(checkData);
      checkData.hash = hash;

      const response = await fetch(`${this.statusCheckUrl}/checkStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkData),
      });

      if (!response.ok) {
        this.logger.error(`CMI status check failed: ${response.statusText}`);
        return { found: false };
      }

      const result = await response.json();
      
      // Vérifier le hash de la réponse
      const responseHash = result.hash;
      delete result.hash;
      const expectedHash = this.generateHash(result);

      if (responseHash !== expectedHash) {
        this.logger.error('Invalid CMI status check hash');
        return { found: false };
      }

      const isSuccess = result.status === 'Approved' || result.status === '00';

      return {
        found: true,
        status: isSuccess ? 'success' : 'failed',
        amount: parseFloat(result.amount || '0'),
        orderId: result.orderId,
        responseCode: result.status,
        responseMessage: result.message || '',
      };
    } catch (error: any) {
      this.logger.error('CMI status check error:', error);
      return { found: false };
    }
  }
}
