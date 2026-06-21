export interface AppConfig {
  apiPort: number;
  corsOrigin: string[];
  pipelineMaxAgeMinutes: number;
  redis: { host: string; port: number };
  scrape: {
    location: string;
    maxPages: number;
    concurrency: number;
    rateMax: number;
    rateDuration: number;
    headless: boolean;
    proxyUrl: string;
    cron: string;
  };
}

export default (): AppConfig => ({
  apiPort: parseInt(process.env.API_PORT || '3001', 10),
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  pipelineMaxAgeMinutes: parseInt(process.env.PIPELINE_MAX_AGE_MINUTES || '720', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  scrape: {
    location: process.env.SCRAPE_LOCATION || 'london',
    maxPages: parseInt(process.env.SCRAPE_MAX_PAGES || '2', 10),
    concurrency: parseInt(process.env.SCRAPE_CONCURRENCY || '2', 10),
    rateMax: parseInt(process.env.SCRAPE_RATE_MAX || '5', 10),
    rateDuration: parseInt(process.env.SCRAPE_RATE_DURATION_MS || '10000', 10),
    headless: (process.env.PLAYWRIGHT_HEADLESS || 'true') !== 'false',
    proxyUrl: process.env.PROXY_URL || '',
    cron: process.env.SCRAPE_CRON || '',
  },
});
