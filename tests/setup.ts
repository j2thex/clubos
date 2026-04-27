import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.test.local"), quiet: true });

const required = ["SUPABASE_TEST_URL", "SUPABASE_TEST_SERVICE_ROLE"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
    `Missing test env: ${missing.join(", ")}. ` +
      `Run \`pnpm supabase start\` then copy the API URL + service_role key into .env.test.local. ` +
      `See .env.test.example.`,
  );
}
