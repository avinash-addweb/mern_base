import { Client } from "@elastic/elasticsearch";
import { env } from "./env.js";
import { logger } from "./logger.js";

let esClient: Client | null = null;

export async function connectElasticsearch(): Promise<void> {
  try {
    esClient = new Client({ node: env.ELASTICSEARCH_URL });
    await esClient.ping();
    logger.info("Elasticsearch connected successfully");
  } catch (error) {
    logger.fatal(error, "Elasticsearch connection error");
    process.exit(1);
  }
}

export function getElasticsearchClient(): Client {
  if (!esClient) {
    throw new Error("Elasticsearch client not initialized. Call connectElasticsearch() first.");
  }
  return esClient;
}

export async function disconnectElasticsearch(): Promise<void> {
  if (esClient) {
    await esClient.close();
    esClient = null;
  }
}
