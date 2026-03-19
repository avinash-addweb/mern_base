import { env, connectMongoDB } from "./config/index.js";
import app from "./app.js";

async function main() {
  // Connect to MongoDB
  await connectMongoDB();

  // Start server
  app.listen(env.PORT, () => {
    console.log(`API server running on http://localhost:${env.PORT}`);
    console.log(`Swagger docs at http://localhost:${env.PORT}/api-docs`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
