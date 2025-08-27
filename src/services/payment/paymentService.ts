import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import { Configs } from '../../config/config';
import { TransactionPayload, InitializeTransactionResponse } from '.';
import { IPaymentRepository } from './paymentRepository';
import { BadRequestError } from '../../internal/error';
import { Transaction } from '../../internal/store/entities/TransactionEntity';

/* Payment Service Contract */
export interface IPaymentService {
  getPaystackClient(): Promise<AxiosInstance>;
  mountHeaders(): any;
  initializeTransaction(payload: TransactionPayload): Promise<InitializeTransactionResponse>;
  verifyTransaction(reference: string): Promise<Transaction>;
  handleWebhook(payload: any, signature: string): Promise<void>;
}

export class PaymentService implements IPaymentService {
  private paystackSecretKey: string;
  private paystackBaseUrl: string;
  private logs: pino.Logger;

  constructor(
    private readonly config: Configs,
    private readonly paymentRepository: IPaymentRepository,
    private logger: pino.Logger,
  ) {
    this.paystackSecretKey = config.paystack.paystackSecretKey;
    this.paystackBaseUrl = config.paystack.paystackBaseUrl;
    this.logs = logger;

    if (!this.paystackSecretKey) {
      this.logs.error(
        'Missing Required config variable <paystack_secret_key: string>...[CATCH_PAYMENT_SERVICE_LEVEL]',
      );
      throw new Error(
        'Missing Required config variable <paystack_secret_key: string>...',
      );
    }
    this.logs.info('✅ Payment Service is ready to make requests...');
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
      this.logs.info(payload, '⏳ Initializing payment...');

      const paystack = await this.getPaystackClient();

      this.logs.debug('💬 Sending request to paystack API...');
      const response = await paystack.post('/transaction/initialize', {
        email: payload.email,
        amount: payload.amount * 100,
        currency: payload.currency,
      });

      /* retrieve data from response */
      const responsePayload: InitializeTransactionResponse = response.data;

      if (responsePayload.status === false) {
        this.logs.error(
          responsePayload,
          '❌ Payment initialization failed...[CATCH_PAYMENT_SERVICE_LEVEL]',
        );
        throw new BadRequestError('API request did not work as planned...');
      } else {
        this.logs.info(
          responsePayload,
          '✅ Payment initialized successfully...',
        );
      }

      /* persist transaction details to database */
      const paymentIntent = await this.paymentRepository.createTransaction({
        amount: payload.amount,
        currency: payload.currency,
        email: payload.email,
        status: 'initiated',
        reference: responsePayload.data.reference,
      });

      this.logs.info(paymentIntent, '✅ Payment data saved successfully...');
      return responsePayload;
    } catch (e) {
      this.logs.info(e, '❌ Payment initialization failed...');
      throw new Error('Payment initialization failed...');
    }
  }

  async verifyTransaction(reference: string): Promise<Transaction> {
    try {
      this.logs.info({ reference }, '⏳ Attempting to verify transaction...');
      const paystack = await this.getPaystackClient();

      const response = await paystack.get('/transaction/verify/${reference}');

      const body = response.data;
      if (body.status === false) {
        this.logs.error(
          '❌ Transaction verification failed...[CATCH_PAYMENT_SERVICE_LEVEL]',
        );
        throw new BadRequestError('API request did not work as planned...');
      }
      this.logs.info(body, '✅ Transaction verified successfully...');

      const updatedTransactionRecord =
        await this.paymentRepository.updateTransactionStatus(
          reference,
          body.status,
        );
      this.logs.info(
        updatedTransactionRecord,
        '✅ Transaction rcord successfully...',
      );
      return updatedTransactionRecord;
    } catch (e) {
      this.logs.info(e, '❌ Transaction verification failed...');
      throw new Error('Transaction verification failed...');
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      const crypto = require('crypto');
      const secret = this.paystackSecretKey;
      const hash = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        this.logs.error(
          '❌ Invalid webhook signature...[CATCH_PAYMENT_SERVICE_LEVEL]',
        );
        throw new Error('Invalid signature...');
      }
      this.logs.info('✅ Valid webhook signature...');

      const { event, data } = payload;
      if (event === 'charge.success') {
        await this.verifyTransaction(data.reference);
        this.logs.info('✅ Webhook transaction processed successfully...');
      }
    } catch (e) {
      this.logs.error(e, '❌ Error servicing webhook request...');
      throw new Error('Error servicing webhook request...');
    }
  }
}
