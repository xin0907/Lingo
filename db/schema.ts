import { relations } from "drizzle-orm";
import { serial, pgTable, text, integer } from "drizzle-orm/pg-core";

// serial 会自动递增
export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    imageSrc: text("image_src").notNull()
})

export const coursesRelations = relations(courses, ({ many }) => ({
    userProgress: many(userProgress),
}))

export const userProgress = pgTable("user_progress", {
    userId: text("user id").primaryKey(),
    userName: text("user name").notNull().default("User"),
    userImageSrc: text("user image src").notNull().default("/mascot.svg"),
    activeCourseId: integer("active course id").references(() => courses.id, { onDelete: "cascade" }),
    hearts: integer("hearts").notNull().default(5),
    points: integer("points").notNull().default(0)
})

export const userProgressRelations = relations(userProgress, ({ one }) => ({
    activeCourse: one(courses, {
        fields: [userProgress.activeCourseId],
        references: [courses.id]
    })
}))