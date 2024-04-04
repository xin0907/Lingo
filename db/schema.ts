import { serial, pgTable, text } from "drizzle-orm/pg-core";

// serial 会自动递增
export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    imageSrc: text("image_src").notNull()
})
