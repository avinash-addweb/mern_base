import { env, connectMongoDB, connectRedis, connectElasticsearch } from "./config/index.js";
import { logger } from "./config/logger.js";
import { initializeEmailTransport } from "./services/email.service.js";
import app from "./app.js";

async function main() {
  await connectMongoDB();
  await connectRedis();
  await connectElasticsearch();
  await initializeEmailTransport();

  app.listen(env.PORT, () => {
    logger.info(`API server running on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs at http://localhost:${env.PORT}/api-docs`);
  });
}

main().catch((error) => {
  logger.fatal(error, "Failed to start server");
  process.exit(1);
});
