import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DatabaseState = {
  client?: ReturnType<typeof postgres>;
  database?: ReturnType<typeof drizzle>;
};

const globalDatabase = globalThis as typeof globalThis & { __database?: DatabaseState };

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  globalDatabase.__database ??= {};
  globalDatabase.__database.client ??= postgres(connectionString, {
    max: 1,
    prepare: false,
  });
  globalDatabase.__database.database ??= drizzle(globalDatabase.__database.client, { schema });

  return globalDatabase.__database.database;
}
