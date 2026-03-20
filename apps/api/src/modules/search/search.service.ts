import { searchDocuments, ensureIndex } from "../../services/elasticsearch.service.js";
import { logger } from "../../config/logger.js";

const INDEX_FIELD_MAP: Record<string, string[]> = {
  users: ["name", "email", "role"],
};

export const searchService = {
  async search(query: string, index: string, page: number, limit: number) {
    const fields = INDEX_FIELD_MAP[index] || ["*"];
    return searchDocuments(index, query, fields, page, limit);
  },

  async initUserIndex() {
    try {
      await ensureIndex("users", {
        name: { type: "text" },
        email: { type: "text" },
        role: { type: "keyword" },
      });
    } catch (error) {
      logger.warn(error, "Failed to initialize users ES index (non-fatal)");
    }
  },
};
