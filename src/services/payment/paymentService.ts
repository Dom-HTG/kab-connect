import axios from 'axios';
import { Configs } from '../../config/config';
import { TransactionPayload, InitializeTransactionResponse } from '.';

// interface PaymentHeaders extends AxiosHeaders {
//     Authorization: string;
//     'Content-Type': string;
// };

export class PaymentService {
  private paystackSecretKey: string;
  private paystackBaseUrl: string;

  constructor(config: Configs) {
    this.paystackSecretKey = config.paystack.paystackSecretKey;
    this.paystackBaseUrl = config.paystack.paystackBaseUrl;

    if (!this.paystackSecretKey) {
      throw new Error('Paystack secret key is not set in the configuration.');
    }
    console.log('✅ Payment Service is ready to make requests...');
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
    // Make request to Paystack to initialize the transaction.
    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email: payload.email,
        amount: payload.amount * 100, // Paystack expects amount in kobo
        currency: payload.currency,
      },
      {
        headers: this.mountHeaders(),
      },
    );

    // Return formatted response data.
    const responseData: InitializeTransactionResponse = {
      status: response.data.status,
      message: response.data.message,
      data: {
        authorization_url: response.data.data.authorization_url,
        access_code: response.data.data.access_code,
        reference: response.data.data.reference,
      },
    };

    console.log('✅ Payment initialized...');
    return responseData;
  }

  async verifyTransaction(reference: string): Promise<void> {
    // Make request to Paystack to verify the transaction.
    const response = await axios.get(
      `${this.paystackBaseUrl}/transaction/verify/${reference}`,
      {
        headers: this.mountHeaders(),
      },
    );

    // Check if the transaction was successful.
    if (response.data.status && response.data.data.status === 'success') {
      console.log('✅ Transaction verified successfully:', response.data.data);
    } else {
      throw new Error('Transaction verification failed.');
    }
  }
}
