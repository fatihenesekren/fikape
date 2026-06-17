import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
require("dotenv").config();

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS vehicle_suggestions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "brandName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    year INTEGER,
    "categorySlug" TEXT NOT NULL,
    "fuelType" TEXT,
    "trimName" TEXT,
    notes VARCHAR(500),
    status TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "reviewedAt" TIMESTAMPTZ,
    "reviewedBy" INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_vs_status ON vehicle_suggestions(status);
  CREATE INDEX IF NOT EXISTS idx_vs_user ON vehicle_suggestions("userId");
`);

console.log("vehicle_suggestions table ready");
await client.end();
