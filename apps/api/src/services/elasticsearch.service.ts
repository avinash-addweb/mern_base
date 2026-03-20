import { getElasticsearchClient } from "../config/elasticsearch.js";
import { logger } from "../config/logger.js";

export async function ensureIndex(
  index: string,
  mappings: Record<string, { type: string; [key: string]: unknown }>,
): Promise<void> {
  const es = getElasticsearchClient();
  const exists = await es.indices.exists({ index });
  if (!exists) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await es.indices.create({ index, mappings: { properties: mappings as any } });
    logger.info({ index }, "Elasticsearch index created");
  }
}

export async function indexDocument(
  index: string,
  id: string,
  document: Record<string, unknown>,
): Promise<void> {
  const es = getElasticsearchClient();
  await es.index({ index, id, document });
}

export async function searchDocuments(
  index: string,
  query: string,
  fields: string[],
  page = 1,
  limit = 10,
): Promise<{ hits: Record<string, unknown>[]; total: number }> {
  const es = getElasticsearchClient();
  const result = await es.search({
    index,
    query: { multi_match: { query, fields } },
    size: limit,
    from: (page - 1) * limit,
  });

  const total =
    typeof result.hits.total === "number" ? result.hits.total : (result.hits.total?.value ?? 0);

  return {
    hits: result.hits.hits.map((h) => {
      const source = (h._source ?? {}) as Record<string, unknown>;
      return { id: h._id, ...source };
    }),
    total,
  };
}

export async function deleteDocument(index: string, id: string): Promise<void> {
  const es = getElasticsearchClient();
  try {
    await es.delete({ index, id });
  } catch (error: unknown) {
    const esError = error as { meta?: { statusCode?: number } };
    if (esError.meta?.statusCode === 404) return;
    throw error;
  }
}
