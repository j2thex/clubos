import { config } from "dotenv";
import { resolve } from "node:path";

// Load test env if present. Pure-logic tests don't need it; integration
// tests assert their own env via getTestClient().
config({ path: resolve(process.cwd(), ".env.test.local"), quiet: true });
