import axios, { AxiosInstance } from 'axios';
import { Configs } from '../../config/config';
import { TransactionPayload, InitializeTransactionResponse } from '.';
import { IPaymentRepository, ITransaction } from './paymentRepository';
import { BadRequestError, NotFoundErrror } from '../../internal/error';

/* Payment Service Contract */
export interface IPaymentService {
  getPaystackClient(): Promise<AxiosInstance>;
  mountHeaders(): any;
  initializeTransaction(
    payload: TransactionPayload,
  ): Promise<InitializeTransactionResponse>;
  verifyTransaction(reference: string): Promise<any>;
  handleWebhook(payload: any, signature: string): Promise<void>;
}

export class PaymentService implements IPaymentService {
  private paystackSecretKey: string;
  private paystackBaseUrl: string;

  constructor(private readonly config: Configs, private readonly paymentRepository: IPaymentRepository) {
    this.paystackSecretKey = config.paystack.paystackSecretKey;
    this.paystackBaseUrl = config.paystack.paystackBaseUrl;

    if (!this.paystackSecretKey) {
      throw new Error(
        'Missing Required config variable <paystack_secret_key: string>...',
      );
    }
    console.log('✅ Payment Service is ready to make requests...');
  }

  async getPaystackClient(): Promise<AxiosInstance> {
    const paystackClient = axios.create({
      baseURL: this.paystackBaseUrl,
      headers: this.mountHeaders(),
    });
    return paystackClient;
  }

  mountHeaders() {
    const headers = {
      Authorization: `Bearer ${this.paystackSecretKey}`,
      'Content-Type': 'application/json',
    };
    return headers;
  }

  async initializeTransaction(
    payload: TransactionPayload,
  ): Promise<InitializeTransactionResponse> {
    try {
      const paystack = await this.getPaystackClient();

      const response = await paystack.post('/transaction/initialize', {
        email: payload.email,
        amount: payload.amount * 100,
        currency: payload.currency,
      });

      /* retrieve data from response */
      const responsePayload: InitializeTransactionResponse = response.data;

      /* persist transaction details to database */
      await this.paymentRepository.createTransaction({
        amount: payload.amount,
        currency: payload.currency,
        email: payload.email,
        status: 'initiated',
        reference: responsePayload.data.reference,
      });
      
      console.log('✅ Payment initialized...');
      return responsePayload;
    } catch (e) {
      throw new Error('Could not initialize payment');
    };
  };

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const paystack = await this.getPaystackClient();

      const response = await paystack.get('/transaction/verify/${reference}');

      const { status } = response.data.data;
      if (!status) throw new BadRequestError('API request did not work as planned...');

      const updatedTransactionRecord = await this.paymentRepository.updateTransactionStatus(reference, status);
      return updatedTransactionRecord;
    } catch (e) {
      throw new Error('Error attempting to verify transaction');
    }
  };

  async handleWebhook(payload: any, signature: string): Promise<void> {
   try {
      const crypto = require('crypto');
      const secret = this.paystackSecretKey;
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

      if (hash !== signature) {
        console.warn('Invalid webhook signature received');
        throw new Error('Invalid signature');
      }

      const { event, data } = payload;
      if (event === 'charge.success') {
        await this.verifyTransaction(data.reference);
      }
   } catch (e) {
     throw new Error ('Error servicing webhook request...');
   }
  };
}