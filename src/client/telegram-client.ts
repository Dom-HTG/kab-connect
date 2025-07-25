import { Telegraf, Context, Markup } from 'telegraf';
import { Configs } from '../config/config';
import { Application } from 'express';

export class TelegramClient {
    private bot: Telegraf<Context>;

    constructor(public readonly config: Configs) {
        this.bot = new Telegraf(config.telegram.telegramToken);

        if (this.bot !== undefined) {
            console.log('Launching Telegram Bot...');
        }
    }

    public initWebhook(app: Application, webhookPath: string, webhookUrl: string) {
        // Register handlers
        this.handleStartCommand();
        this.handlePayAction();
        this.handleGenerateLoginAction();

        // Register webhook
        this.bot.telegram.setWebhook(`${webhookUrl}${webhookPath}`)
        .then(() => {
            console.log('✅ Webhook configured with Telegram successfully...');
        })
        .catch((e: any) => {
            console.error(`Failure to set Telegram message: ${e.message}`);
        });
        app.use(webhookPath, this.bot.webhookCallback(webhookPath));
        console.log('✅ Telegram bot is running...');
    }

    private handleStartCommand() {
        this.bot.start((ctx: Context) => {
            ctx.reply(
                `👋 Welcome to *Kab Connect*!\n\n📶 Get 24-hour Internet access for just *₦500*.\n\nStay connected. — Kab Connect`,
                { parse_mode: 'Markdown' }
            );

            ctx.reply(
                `To continue, you’ll pay through our secure platform using a *bank transfer* or *debit card*. Once payment is complete, you’ll receive a *login* to get online.`,
                Markup.inlineKeyboard([
                    Markup.button.callback('🚀 Proceed to Payment', 'pay'),
                ])
            );
        });
    }

    private handlePayAction() {
        this.bot.action('pay', async (ctx: Context) => {
            await ctx.answerCbQuery();
            await ctx.reply(
                `💳 *Payment Instructions*\n\nTransfer *₦500* to:\n\n*Account Name:* Kab Connect\n*Account Number:* 1234567890\n*Bank:* Paystack Bank\n\nAfter payment, tap below to generate your login.`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        Markup.button.callback('✅ I’ve Paid, Generate Login', 'generate_login'),
                    ]),
                }
            );
        });
    }

    private handleGenerateLoginAction() {
        this.bot.action('generate_login', async (ctx: Context) => {
            await ctx.answerCbQuery();

            const username = `kab_${Math.random().toString(36).substring(2, 6)}`;
            const password = Math.random().toString(36).substring(2, 8);

            await ctx.reply(
                `🔐 *Your Wi-Fi Login*\n\n*Username:* \`${username}\`\n*Password:* \`${password}\`\n\nUse these credentials to log into the Kab Connect Wi-Fi network. Enjoy!`,
                { parse_mode: 'Markdown' }
            );
        });
    }
}
