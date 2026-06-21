export const CRAWL_SEARCH_QUEUE = 'crawl-search';
export const SCRAPE_LISTING_QUEUE = 'scrape-listing';

export interface CrawlSearchJob {
  runId: string;
  location: string;
  page: number;
  maxPages: number;
}

export interface ScrapeListingJob {
  runId: string;
  url: string;
}
