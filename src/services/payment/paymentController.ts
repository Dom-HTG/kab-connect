import express from 'express';
import { TransactionPayload } from '.';
import { BadRequestError } from '../../internal/error';
import { IPaymentService } from './paymentService';

/* Payment Controller contract */

// export interface IPaymentController {
//   registerRoutes(router: express.Router): express.Router;
//   initialize(
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction,
//   ): Promise<void>;
//   verify(
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction,
//   ): Promise<void>;
// }

export class PaymentController {
  constructor(private readonly paystackClient: IPaymentService) {}

  public registerRoutes = (router: express.Router): express.Router => {
    router.post('/init', this.initialize);
    router.get('/verify/:reference', this.verify);

    return router;
  };

  public initialize = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { email, amount } = req.body;

      if (!email || !amount)
        throw new BadRequestError('Email and amount are required');

      const payload: TransactionPayload = {
        email,
        amount,
      };

      const result = await this.paystackClient.initializeTransaction(payload);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      next(err);
    }
  };

  public verify = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const { reference } = req.params;
      if (!reference)
        throw new BadRequestError(
          'Missing required parameter <reference:string>',
        );
      const result = await this.paystackClient.verifyTransaction(reference);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      console.error('Transaction verification failed..')
      next(err);
    }
  };

  handleWebhook = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = req.body;

      await this.paystackClient.handleWebhook(payload, signature);

      res.status(200).json({ success: true, message: 'Webhook processed' });

    } catch (error) {
      console.error('Webhook processing failed', error);
      // Still return 200 to Paystack so it doesn't retry excessively for signature errors
      res.status(200).json({ success: false, message: 'Webhook processing failed' });
    }
  };
}
