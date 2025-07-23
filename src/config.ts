export interface Configs {
    port: string;
    appUrl: string;
    telegram: TelegramConfig;
    twilio: TwilioConfig;
};

interface TelegramConfig {
    telegramToken: string;
};

interface TwilioConfig {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
};

export class AppConfig {
    public readonly port: string;
    public readonly appUrl: string;
    public readonly twilioAccountSid: string;
    public readonly twilioAuthToken: string;
    public readonly twilioPhoneNumber: string;
    public readonly telegramToken: string;

    constructor() {
        this.port = this.getenv('PORT');
        this.appUrl = this.getenv('APP_URL');
        this.telegramToken = this.getenv('TELEGRAM_TOKEN');
        // Twilio configuration
        this.twilioAccountSid = this.getenv('TWILIO_ACCOUNT_SID');
        this.twilioAuthToken = this.getenv('TWILIO_AUTH_TOKEN');
        this.twilioPhoneNumber = this.getenv('TWILIO_PHONE_NUMBER');
    }

    private getenv(key: string): string {
        const value = process.env[key];
        if (value === undefined || value === null || !value) {
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
        };
    };
};