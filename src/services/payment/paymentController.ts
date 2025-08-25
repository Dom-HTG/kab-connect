import express from 'express';
import pino from 'pino';
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
  private logs: pino.Logger;
  constructor(
    private readonly paystackClient: IPaymentService,
    logger: pino.Logger,
  ) {
    this.logs = logger;
  }

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

      if (!email || !amount) {
        this.logs.error(
          'Missing required parameters: <email:string> or <amount:number>...[CATCH_PAYMENT_CONTROLLER_LEVEL]',
        );
        throw new BadRequestError(
          'Missing required parameters: <email:string> or <amount:number>',
        );
      }

      const payload: TransactionPayload = {
        email,
        amount,
      };

      const result = await this.paystackClient.initializeTransaction(payload);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      this.logs.error(err, 'Error initializing transaction...');
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
      if (!reference) {
        this.logs.error(
          'Missing required parameter: <reference>...[CATCH_PAYMENT_CONTROLLER_LEVEL]',
        );
        throw new BadRequestError('Missing required parameter: <reference>');
      }

      const result = await this.paystackClient.verifyTransaction(reference);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      this.logs.error(err, 'Error verifying transaction...');
      next(err);
    }
  };

  handleWebhook = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = req.body;

      await this.paystackClient.handleWebhook(payload, signature);

      res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      next(error);
    }
  };
}
