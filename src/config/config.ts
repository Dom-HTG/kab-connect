export interface Configs {
  server: ServerConfig;
  telegram: TelegramConfig;
  paystack: PaystackConfig;
  db: DbConfig;
}

export interface ServerConfig {
  port: string;
  appUrl: string;
}

interface TelegramConfig {
  telegramToken: string;
}

interface PaystackConfig {
  paystackBaseUrl: string;
  paystackSecretKey: string;
}

interface DbConfig {
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbHost?: string;
  dbPort?: string;
}

export class AppConfig {
  // Server config.
  public readonly port: string;
  public readonly appUrl: string;

  // Telegram config.
  public readonly telegramToken: string;

  // Paystack config.
  public readonly paystackBaseUrl: string;
  public readonly paystackSecretKey: string;

  // Database config.
  public readonly dbUser: string;
  public readonly dbPassword: string;
  public readonly dbName: string;
  public readonly dbHost: string;
  public readonly dbPort: string;

  constructor() {
    // Load environment variables when the class is instantiated.
    this.port = this.getenv('APP_PORT');
    this.appUrl = this.getenv('APP_URL');
    this.telegramToken = this.getenv('TELEGRAM_TOKEN');
    this.paystackBaseUrl = this.getenv('PAYSTACK_BASE_URL');
    this.paystackSecretKey = this.getenv('PAYSTACK_SECRET_KEY');
    this.dbUser = this.getenv('POSTGRES_USER');
    this.dbPassword = this.getenv('POSTGRES_PASSWORD');
    this.dbName = this.getenv('POSTGRES_DB');
    this.dbHost = this.getenv('POSTGRES_HOST');
    this.dbPort = this.getenv('POSTGRES_PORT');
  }

  private getenv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }

  public serveConfig(): Configs {
    return {
      server: {
        port: this.port,
        appUrl: this.appUrl,
      },
      telegram: {
        telegramToken: this.telegramToken,
      },
      paystack: {
        paystackBaseUrl: this.paystackBaseUrl,
        paystackSecretKey: this.paystackSecretKey,
      },
      db: {
        dbName: this.dbName,
        dbPassword: this.dbPassword,
        dbUser: this.dbUser,
      },
    };
  }
}
