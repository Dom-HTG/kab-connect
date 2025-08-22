import { Request, Response, Router } from 'express';
import { PaymentService } from './paymentService';
import { TransactionPayload } from '.';

export class PaymentController {
  private readonly paystack: PaymentService;

  constructor(paystackClient: PaymentService) {
    this.paystack = paystackClient;
  }

  public registerRoutes = (router: Router): Router => {
    router.post('/init', this.initialize);
    router.get('/verify/:reference', this.verify);

    return router;
  };

  public initialize = async (req: Request, res: Response) => {
    try {
      const { email, amount } = req.body;

      if (!email || !amount) {
        return res
          .status(400)
          .json({ status: 'error', message: 'Email and amount are required.' });
      }

      const payload: TransactionPayload = {
        email,
        amount,
      };

      const result = await this.paystack.initializeTransaction(payload);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  public verify = async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      const result = await this.paystack.verifyTransaction(reference);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  };
}
