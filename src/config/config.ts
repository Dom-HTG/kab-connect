export interface Configs {
    port: string;
    appUrl: string;
    telegram: TelegramConfig;
    twilio: TwilioConfig;
    paystack: PaystackConfig
};

interface TelegramConfig {
    telegramToken: string;
};

interface TwilioConfig {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
};

interface PaystackConfig {
    paystackBaseUrl: string;
    paystackSecretKey: string;
};

export class AppConfig {
    // Application config.
    public readonly port: string;
    public readonly appUrl: string;

    // Twilio config.
    public readonly twilioAccountSid: string;
    public readonly twilioAuthToken: string;
    public readonly twilioPhoneNumber: string;

    // Telegram config.
    public readonly telegramToken: string;

    // Paystack config.
    public readonly paystackBaseUrl: string;
    public readonly paystackSecretKey: string;

    constructor() {
        // Load environment variables when the class is instantiated.
        this.port = this.getenv('PORT');
        this.appUrl = this.getenv('APP_URL');
        this.telegramToken = this.getenv('TELEGRAM_TOKEN');
        this.twilioAccountSid = this.getenv('TWILIO_ACCOUNT_SID');
        this.twilioAuthToken = this.getenv('TWILIO_AUTH_TOKEN');
        this.twilioPhoneNumber = this.getenv('TWILIO_PHONE_NUMBER');
        this.paystackBaseUrl = this.getenv('PAYSTACK_BASE_URL');
        this.paystackSecretKey = this.getenv('PAYSTACK_SECRET_KEY');
    }

    private getenv(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Environment variable ${key} is not set.`);
        };
        return value;
    };

    public serveConfig(): Configs {
        return {
            port: this.port,
            appUrl: this.appUrl,
            telegram: {
                telegramToken: this.telegramToken,
            },
            twilio: {
                twilioAccountSid: this.twilioAccountSid,
                twilioAuthToken: this.twilioAuthToken,
                twilioPhoneNumber: this.twilioPhoneNumber,
            },
            paystack: {
                paystackBaseUrl: this.paystackBaseUrl,
                paystackSecretKey: this.paystackSecretKey,
            },
        };
    };
};