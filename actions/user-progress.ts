"use server"

import { auth, currentUser } from "@clerk/nextjs"
import { getCourseById, getUserProgress } from "@/db/queries"

import db from "@/db/drizzle"
import { and, eq } from "drizzle-orm"
import { challengeProgress, challenges, userProgress } from "@/db/schema"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export const upsertUserProgress = async (courseId: number) => {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) throw new Error("Unauthorized")

    const course = await getCourseById(courseId)
    if (!course) throw new Error("Course not found")
    // if (!course.units.length || !course.units[0].lessons.length) {
    //     throw new Error("Course is empty")
    // }

    // 获取用户学习进度
    const existingUserProgress = await getUserProgress();

    // 如果已经有学习进度，则更新
    if (existingUserProgress) {
        await db.update(userProgress).set({
            activeCourseId: courseId,
            userName: user.firstName || "User",
            userImageSrc: user.imageUrl || "/mascot.svg"
        })
        // 用于重新验证指定路径的数据
        revalidatePath("/courses");
        revalidatePath("/learn");
        redirect("/learn");
    }

    // 新增一条学习进度
    await db.insert(userProgress).values({
        userId,
        activeCourseId: courseId,
        userName: user.firstName || "User",
        userImageSrc: user.imageUrl || "/mascot.svg"
    })

    revalidatePath("/courses");
    revalidatePath("/learn");
    redirect("/learn");
}

// 处理选中不正确的情况
export const reduceHearts = async (challengeId: number) => {
    const { userId } = await auth()

    if (!userId) throw new Error("Unauthorized")

    const currentUserProgress = await getUserProgress()

    const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId)
    })
    if (!challenge) throw new Error("challenge not found")
    const lessonId = challenge.lessonId

    const existingChallengeProgress = await db.query.challengeProgress.findFirst({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
        )
    })

    const isPractice = !!existingChallengeProgress
    if (isPractice) return { error: "practice" }
    if (!currentUserProgress) throw new Error("User progress not found")
    if (currentUserProgress.hearts === 0) return { error: "hearts" }

    await db.update(userProgress).set({
        hearts: Math.max(currentUserProgress.hearts - 1, 0)
    }).where(eq(userProgress.userId, userId))

    revalidatePath("/shop");
    revalidatePath("/learn");
    revalidatePath("/quests");
    revalidatePath("/leaderboard");
    revalidatePath(`/lesson/${lessonId}`);
}