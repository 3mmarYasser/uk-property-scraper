import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class StartScrapeDto {
  /** OnTheMarket location slug, e.g. "london", "greater-manchester". */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'location must be a lowercase URL slug (letters, numbers, hyphens)',
  })
  location?: string;

  /** Bounded so a single request cannot kick off an unbounded crawl. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxPages?: number;
}
