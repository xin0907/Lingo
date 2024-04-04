import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)

// 应用模式，使用 orm
const db = drizzle(sql, { schema })

export default db
