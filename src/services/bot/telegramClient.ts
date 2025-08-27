import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { Configs } from '../../config/config';
import { Application } from 'express';
import axios from 'axios';
import { PostgresService } from '../../internal/store/database';
import pino from 'pino';

export class TelegramClient {
  private bot: Telegraf<Context>;
  private logs: pino.Logger;

  constructor(
    public readonly config: Configs,
    private readonly dbClient: PostgresService,
    private logger: pino.Logger,
  ) {
    this.logs = logger;
    this.bot = new Telegraf(config.telegram.telegramToken);
    if (!config.telegram.telegramToken) {
      this.logs.error(
        'Missing Required config variable <telegram_token: string>...[CATCH_TELEGRAM_CLIENT_LEVEL]',
      );
      throw new Error(
        'Missing Required config variable <telegram_token: string>...',
      );
    }
    this.logs.info('✅ Telegram Client is ready...');
  }

  /** Register bot commands and actions */
  private registerCommands() {
    this.bot.command('start', this.startCommand());
    this.bot.command('buy', this.buyCommand());
    this.bot.command('help', this.helpCommand());

    this.bot.action('pay', this.payAction());
    this.bot.action('generate_login', this.generateLoginAction());

    this.bot.on(message('text'), this.handleEmailReply());

    this.logs.info('✅ Telegram commands registered successfully...');
  }

  /** Launch bot with polling (for development) */
  public initBotDev() {
    this.registerCommands();
    this.bot
      .launch()
      .then(() => console.log('✅ Telegram bot is running...'))
      .catch((e) => console.error(`❌ Failed to launch bot: ${e.message}`));
  }

  /** Launch bot with webhook (for production) */
  public initBotProd(
    app: Application,
    webhookPath: string,
    webhookUrl: string,
  ) {
    this.registerCommands();

    this.bot.telegram
      .setWebhook(`${webhookUrl}${webhookPath}`)
      .then(() => this.logs.info('✅ Webhook configured successfully...'))
      .catch((e) => this.logs.error(`❌ Failed to set webhook: ${e.message}`));

    app.use(webhookPath, this.bot.webhookCallback(webhookPath));
  }

  /** Graceful shutdown (no process.exit here) */
  public stopBot(reason?: string) {
    this.logs.info(
      `Stopping Telegram bot... ${reason ? `Reason: ${reason}` : ''}`,
    );
    this.bot.stop(reason || 'Bot stopped');
    this.logs.info('✅ Telegram bot stopped gracefully...');
  }

  /** Commands */
  private startCommand() {
    return async (ctx: Context) => {
      await ctx.reply(
        `👋 Welcome to *Kab Connect*!\n\n📶 Get 24-hour Internet access for just *₦500*.\n\nStay connected. — Kab Connect`,
        { parse_mode: 'Markdown' },
      );

      await ctx.reply(
        `To continue, pay via *bank transfer* or *debit card*. Once payment is complete, you’ll receive your *login* to get online.`,
        Markup.inlineKeyboard([
          Markup.button.callback('🚀 Proceed to Payment', 'pay'),
        ]),
      );
    };
  }

  private buyCommand() {
    return async (ctx: Context) => {
      await ctx.reply(
        'To start your purchase, use the /start command and tap "Proceed to Payment".',
      );
    };
  }

  private helpCommand() {
    return async (ctx: Context) => {
      await ctx.reply(
        `ℹ️ Available Commands:\n/start - Begin\n/buy - Start purchase\n/help - Show help`,
      );
    };
  }

  /** Actions */
  private payAction() {
    return async (ctx: Context) => {
      await ctx.answerCbQuery();
      const telegramId = ctx.from?.id;

      if (!telegramId) {
        await ctx.reply('❌ Could not detect your Telegram ID.');
        return;
      }

      // Look for an existing session for this Telegram ID
      const existingSession = await this.dbClient
        .getSessionRepository()
        .findOne({
          where: { telegramId, status: 'active' },
        });

      if (!existingSession) {
        await ctx.reply(
          '📧 Please enter your email address to proceed with payment:',
          Markup.forceReply(),
        );
        // Create a new session with empty email, status 'active'
        const newSession = this.dbClient.getSessionRepository().create({
          telegramId,
          email: '',
          status: 'active',
        });
        await this.dbClient.getSessionRepository().save(newSession);
        console.log(`✅ New session created for Telegram ID: ${telegramId}`);
      } else if (existingSession.email) {
        await this.initiatePayment(ctx, existingSession.email);
      } else {
        await ctx.reply(
          '📧 Please enter your email address to proceed with payment:',
          Markup.forceReply(),
        );
      }
    };
  }

  private handleEmailReply() {
    return async (ctx: Context) => {
      if (!ctx.message || typeof (ctx.message as any).text !== 'string') {
        await ctx.reply('❌ Please send a text message.');
        return;
      }

      const text = (ctx.message as any).text.trim();
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      // Find active session for this Telegram ID
      const sessionRepo = this.dbClient.getSessionRepository();
      const session = await sessionRepo.findOne({
        where: { telegramId, status: 'active' },
      });

      if (session && !session.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          await ctx.reply(
            '❌ Invalid email. Please enter a valid email address.',
          );
          return;
        }

        session.email = text;
        await sessionRepo.save(session);
        await ctx.reply('✅ Email saved! Generating payment link...');
        await this.initiatePayment(ctx, text);
      }
    };
  }

  private async initiatePayment(ctx: Context, email: string) {
    const telegramId = ctx.from?.id;
    const amount = 500 * 100;

    try {
      const { data } = await axios.post(
        `${this.config.server.appUrl}/payment/init`,
        {
          email,
          amount,
          metadata: { telegramId },
        },
      );

      if (data.status === 'success') {
        await ctx.reply(
          `💳 Click below to complete your ₦500 payment:`,
          Markup.inlineKeyboard([
            Markup.button.url('🚀 Pay Now', data.data.authorization_url),
            Markup.button.callback(
              '✅ I’ve Paid, Generate Login',
              'generate_login',
            ),
          ]),
        );
      } else {
        await ctx.reply(`❌ Payment init failed: ${data.message}`);
      }
    } catch (e: any) {
      this.logs.error(`❌ Payment error: ${e.message}`);
      await ctx.reply('❌ Could not initiate payment. Try again later.');
    }
  }

  private generateLoginAction() {
    return async (ctx: Context) => {
      await ctx.answerCbQuery();
      const username = `kab_${Math.random().toString(36).slice(2, 6)}`;
      const password = Math.random().toString(36).slice(2, 8);

      await ctx.reply(
        `🔐 *Your Wi-Fi Login*\n\n*Username:* \`${username}\`\n*Password:* \`${password}\`\n\nUse these credentials to log into the Kab Connect Wi-Fi network. Enjoy!`,
        { parse_mode: 'Markdown' },
      );
    };
  }
}
