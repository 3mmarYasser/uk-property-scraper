import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Browser, chromium } from 'playwright';

/** Thrown when a page looks like an anti-bot challenge rather than real content. */
export class BlockedError extends Error {
  constructor(url: string) {
    super(`Request to ${url} appears to have been blocked (anti-bot challenge).`);
    this.name = 'BlockedError';
  }
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const BLOCK_SIGNATURES = [
  'px-captcha',
  'data-px-',
  'captcha-delivery',
  'Just a moment...', // Cloudflare interstitial
  'cf-browser-verification',
  'Access Denied',
  'unusual traffic',
];

/**
 * Wraps a single shared headless Chromium browser and hands out fresh, isolated
 * contexts per request. Centralising fetching here is what lets us apply
 * consistent anti-bot hardening, politeness jitter and block-detection in one
 * place (see docs/production.md → "Anti-bot protections").
 */
@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;
  private launching: Promise<Browser> | null = null;

  constructor(private readonly config: ConfigService) {}

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    if (this.launching) return this.launching;

    const headless = this.config.get<boolean>('scrape.headless') ?? true;
    const proxyUrl = this.config.get<string>('scrape.proxyUrl') || '';

    this.launching = chromium
      .launch({
        headless,
        proxy: proxyUrl ? { server: proxyUrl } : undefined,
        args: ['--disable-blink-features=AutomationControlled'],
      })
      .then((b) => {
        this.browser = b;
        this.logger.log(`Launched Chromium (headless=${headless})`);
        return b;
      })
      .catch((err) => {
        // Reset so a transient launch failure does not leave every future
        // fetch awaiting a permanently-rejected promise.
        this.logger.error(`Chromium launch failed: ${err.message}`);
        throw err;
      })
      .finally(() => {
        this.launching = null;
      });

    return this.launching;
  }

  /** Navigate to a URL and return the fully-rendered HTML. */
  async fetchHtml(url: string): Promise<string> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1366, height: 900 },
      locale: 'en-GB',
      timezoneId: 'Europe/London',
      extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
    });

    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      // Small human-like pause so we are not perfectly metronomic.
      await page.waitForTimeout(300 + Math.floor(Math.random() * 700));
      const html = await page.content();

      if (this.looksBlocked(html)) {
        throw new BlockedError(url);
      }
      return html;
    } finally {
      await context.close();
    }
  }

  private looksBlocked(html: string): boolean {
    if (html.length < 1000) return true; // suspiciously empty
    return BLOCK_SIGNATURES.some((sig) => html.includes(sig));
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
  }
}
