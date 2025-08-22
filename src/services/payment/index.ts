export interface TransactionPayload {
  email: string;
  amount: number; // Amount in naira (e.g., 500 for ₦500)
  currency?: string;
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}
