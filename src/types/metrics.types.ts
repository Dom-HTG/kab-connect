export type Period =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_year'
  | 'all_time';
type PaymentStatus = 'pending' | 'success' | 'failed';

/*
  Metrics
  -------------------------------------------------
  Main metrics aggregation interface for the captive portal.
  - allTimeMetrics: Aggregates metrics from day 0 (total payments, transactions, sessions).
  - currentSessionMetrics: Metrics for current user sessions.
  - totalSessionMetrics: Session metrics for all time frames.
  - transactionMetrics: Transaction breakdown by period (success, fail, refunded).
*/
export interface Metrics {
  allTimeMetrics: AllTimeMetricsDTO;
  currentSessionMetrics: CurrentConnectionMetricsDTO;
  totalSessionMetrics: TotalSessionMetricsDTO;
  transactionMetrics: TransactionMetricsDTO;
}

/*
  TransactionMetricsDTO
  -------------------------------------------------
  Aggregates transaction statistics for a specified period.
  - totalTransactions: Total number of transactions.
  - successfulTransactions: Number of successful transactions.
  - failedTransactions: Number of failed transactions.
  - refundedTransactions: Number of refunded transactions (optional).
  - period: Time window for aggregation.
  - startDate: Start of the reporting window.
  - endDate: End of the reporting window.
*/
export interface TransactionMetricsDTO {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions?: number;
  period: Period;
  startDate: Date;
  endDate: Date;
}

/*
  PaymentTransactionDTO
  -------------------------------------------------
  Represents a single payment transaction.
  - id: Unique transaction ID.
  - userId: Telegram user ID.
  - email: User's email address.
  - amount: Amount paid.
  - currency: Currency code (e.g., NGN).
  - reference: Paystack transaction reference.
  - status: Payment status (pending, success, failed).
  - createdAt: Timestamp of payment.
*/
export interface PaymentTransactionDTO {
  id: string;
  userId: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  status: PaymentStatus;
  createdAt: Date;
}

/*
  TotalPaymentMetricsDTO
  -------------------------------------------------
  Aggregates payment totals over various time frames.
  - totalToday: Payments made today.
  - totalThisWeek: Payments made this week.
  - totalThisMonth: Payments made this month.
  - totalThisYear: Payments made this year.
  - totalOverall: Total payments ever recorded.
*/
export interface TotalPaymentMetricsDTO {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  totalThisYear: number;
  totalOverall: number;
}

/*
  AllTimeMetricsDTO
  -------------------------------------------------
  Summarizes cumulative session and payment data for all time.
  - totalPayments: Total revenue collected.
  - totalTransactions: Total number of payment transactions.
  - totalSessions: Total number of sessions.
  - totalUsers: Total number of unique users.
  - period: Time window for aggregation.
*/
export interface AllTimeMetricsDTO {
  totalPayments: number;
  totalTransactions: number;
  totalSessions: number;
  totalUsers: number;
  period: Period;
}

/*
  UserDTO
  -------------------------------------------------
  Represents a user connected to the captive portal.
  - id: Unique user ID.
  - userIp: User's IP address.
  - userMac: User's MAC address.
  - telegramId: Telegram user ID.
  - email: User's email address.
  - createdAt: Timestamp when user was created (optional).
  - updatedAt: Timestamp when user was last updated (optional).
*/
export interface UserDTO {
  id: string;
  userIp: string;
  userMac: string;
  telegramId: number;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/*
  CurrentConnectionMetricsDTO
  -------------------------------------------------
  Provides a snapshot of active connections in the captive portal.
  - activeCount: Number of users currently online.
  - connectedUsers: Array of UserDTO objects representing each active user.
  - period: Time window for the reported metrics.
  - startDate: Start of the reporting window.
  - endDate: End of the reporting window.
*/
export interface CurrentConnectionMetricsDTO {
  activeCount: number;
  connectedUsers: Array<UserDTO>;
  period: Period;
  startDate: Date;
  endDate: Date;
}

/*
  TotalSessionMetricsDTO
  -------------------------------------------------
  Aggregates total session counts over various time frames.
  - totalToday: Sessions started today.
  - totalThisWeek: Sessions started this week.
  - totalThisMonth: Sessions started this month.
  - totalThisYear: Sessions started this year.
  - totalOverall: Total number of sessions ever recorded.
*/
export interface TotalSessionMetricsDTO {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  totalThisYear: number;
  totalOverall: number;
}
