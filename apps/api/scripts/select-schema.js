import { readFileSync, copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env if it exists
let provider = "postgresql";
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  const match = envContent.match(/^DATABASE_PROVIDER\s*=\s*(.+)$/m);
  if (match) {
    provider = match[1].trim().replace(/["']/g, "");
  }
}

// Allow env var override
provider = process.env.DATABASE_PROVIDER || provider;

const validProviders = ["postgresql", "mysql"];
if (!validProviders.includes(provider)) {
  console.error(
    `Invalid DATABASE_PROVIDER: "${provider}". Must be one of: ${validProviders.join(", ")}`,
  );
  process.exit(1);
}

const schemaDir = resolve(__dirname, "..", "src", "prisma");
const source = resolve(schemaDir, `schema.${provider}.prisma`);
const target = resolve(schemaDir, "schema.prisma");

if (!existsSync(source)) {
  console.error(`Schema file not found: ${source}`);
  process.exit(1);
}

copyFileSync(source, target);
console.log(`Database provider: ${provider} — schema.prisma updated`);
