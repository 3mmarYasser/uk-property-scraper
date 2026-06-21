-- CreateEnum
CREATE TYPE "Portal" AS ENUM ('ONTHEMARKET', 'RIGHTMOVE', 'ZOOPLA');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD_STC', 'REMOVED');

-- CreateEnum
CREATE TYPE "PriceChangeType" AS ENUM ('INITIAL', 'INCREASE', 'DECREASE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "RunTrigger" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "portal" "Portal" NOT NULL DEFAULT 'ONTHEMARKET',
    "portalListingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayAddress" TEXT NOT NULL,
    "outcode" TEXT,
    "postcode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "propertyType" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "description" TEXT,
    "agentName" TEXT,
    "agentBranch" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastScrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "changeType" "PriceChangeType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_runs" (
    "id" TEXT NOT NULL,
    "portal" "Portal" NOT NULL DEFAULT 'ONTHEMARKET',
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "trigger" "RunTrigger" NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "pagesCrawled" INTEGER NOT NULL DEFAULT 0,
    "listingsFound" INTEGER NOT NULL DEFAULT 0,
    "listingsNew" INTEGER NOT NULL DEFAULT 0,
    "listingsUpdated" INTEGER NOT NULL DEFAULT 0,
    "priceChanges" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorSample" TEXT,

    CONSTRAINT "scrape_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_quality_snapshots" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "nullCount" INTEGER NOT NULL,
    "nullRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "field_quality_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- CreateIndex
CREATE INDEX "properties_bedrooms_idx" ON "properties"("bedrooms");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "properties"("propertyType");

-- CreateIndex
CREATE INDEX "properties_outcode_idx" ON "properties"("outcode");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE UNIQUE INDEX "properties_portal_portalListingId_key" ON "properties"("portal", "portalListingId");

-- CreateIndex
CREATE INDEX "property_images_propertyId_idx" ON "property_images"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "property_images_propertyId_url_key" ON "property_images"("propertyId", "url");

-- CreateIndex
CREATE INDEX "price_history_propertyId_recordedAt_idx" ON "price_history"("propertyId", "recordedAt");

-- CreateIndex
CREATE INDEX "scrape_runs_portal_startedAt_idx" ON "scrape_runs"("portal", "startedAt");

-- CreateIndex
CREATE INDEX "scrape_runs_status_idx" ON "scrape_runs"("status");

-- CreateIndex
CREATE INDEX "field_quality_snapshots_field_idx" ON "field_quality_snapshots"("field");

-- CreateIndex
CREATE UNIQUE INDEX "field_quality_snapshots_runId_field_key" ON "field_quality_snapshots"("runId", "field");

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_quality_snapshots" ADD CONSTRAINT "field_quality_snapshots_runId_fkey" FOREIGN KEY ("runId") REFERENCES "scrape_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
