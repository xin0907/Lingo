"use server"

import { auth } from "@clerk/nextjs"
import { getUserProgress, getUserSubscription } from "@/db/queries"

import db from "@/db/drizzle"
import { and, eq } from "drizzle-orm"
import { challengeProgress, challenges, userProgress } from "@/db/schema"
import { revalidatePath } from "next/cache"

// 控制用户正确完成 challenge 的行为
export const upsertChallengeProgress = async (challengeId: number) => {
    const { userId } = await auth()

    if (!userId) throw new Error("Unauthorized")

    const currentUserProgress = await getUserProgress()
    const userSubscription = await getUserSubscription()

    if (!currentUserProgress) throw new Error("User progress not found")

    const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId)
    })

    if (!challenge) throw new Error("Challenge not found")

    const lessonId = challenge.lessonId
    const existingChallengeProgress = await db.query.challengeProgress.findFirst({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
        )
    })

    const isPractice = !!existingChallengeProgress
    // 有无心 + 是否开始挑战 + 是否已订阅
    if (currentUserProgress.hearts === 0
        && !isPractice
        && !userSubscription?.isActive
    ) return { error: "hearts" }

    // 这一行代码更新了数据库中的挑战进度记录，将其标记为已完成。它使用了 db.update() 方法来更新数据，指定了更新的字段（这里是 completed）和更新条件（这里是根据进度记录的ID来更新）。
    if (isPractice) {
        await db.update(challengeProgress).set({
            completed: true
        }).where(eq(challengeProgress.id, existingChallengeProgress.id))

        await db.update(userProgress).set({
            hearts: Math.min(currentUserProgress.hearts + 1, 5),
            points: currentUserProgress.points + 10,
        }).where(eq(userProgress.userId, userId))

        // 硬刷新数据
        revalidatePath("/learn")
        revalidatePath("/lesson")
        revalidatePath("/quests")
        revalidatePath("leaderboard")
        revalidatePath(`/lesson/${lessonId}`)
        return
    }

    // 更新挑战的进度
    await db.insert(challengeProgress).values({
        challengeId,
        userId,
        completed: true
    })

    // 更新某个用户的进度
    await db.update(userProgress).set({
        points: currentUserProgress.points + 10
    }).where(eq(userProgress.userId, userId))

    revalidatePath("/learn")
    revalidatePath("/lesson")
    revalidatePath("/quests")
    revalidatePath("leaderboard")
    revalidatePath(`/lesson/${lessonId}`)
}
