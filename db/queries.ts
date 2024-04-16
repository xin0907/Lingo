import { cache } from "react";

import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import { challengeProgress, courses, lessons, units, userProgress, userSubscription } from "@/db/schema";

export const getCourses = cache(async () => {
    const data = await db.query.courses.findMany()
    return data
})

export const getUserProgress = cache(async () => {
    const { userId } = await auth()
    if (!userId) return null
    const data = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
        with: {
            activeCourse: true
        }
    })
    return data
})

export const getCourseById = cache(async (courseId: number) => {
    const data = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
            units: {
                orderBy: (units, { asc }) => [asc(units.order)],
                with: {
                    lessons: {
                        orderBy: (lessons, { asc }) => [asc(lessons.order)]
                    }
                }
            }
        }
    })
    return data
})

export const getUnits = cache(async () => {
    const { userId } = await auth()
    const userProgress = await getUserProgress()

    if (!userId || !userProgress?.activeCourseId) return []

    const data = await db.query.units.findMany({
        orderBy: (units, { asc }) => [asc(units.order)],
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
                    challenges: {
                        orderBy: (challenges, { asc }) => [asc(challenges.order)],
                        with: {
                            challengeProgress: {
                                where: eq(challengeProgress.userId, userId)
                            }
                        }
                    }
                }
            }
        }
    })

    // 找到所有挑战都完成的 lesson
    const normalizedData = data.map((unit) => {
        const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
            if (lesson.challenges.length === 0) return { ...lesson, completed: false }
            const allCompletedChallenges = lesson.challenges.every((challenge) => {
                return challenge.challengeProgress
                    && challenge.challengeProgress.length > 0
                    && challenge.challengeProgress.every((progress) => progress.completed)
            })
            return { ...lesson, completed: allCompletedChallenges }
        })
        return { ...unit, lessons: lessonsWithCompletedStatus }
    })

    return normalizedData
})

export const getCourseProgress = cache(async () => {
    const { userId } = await auth();
    const userProgress = await getUserProgress();

    if (!userId || !userProgress?.activeCourseId) {
        return null;
    }

    const unitsInActiveCourse = await db.query.units.findMany({
        orderBy: (units, { asc }) => [asc(units.order)],
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
                    unit: true,
                    challenges: {
                        with: {
                            challengeProgress: {
                                where: eq(challengeProgress.userId, userId),
                            },
                        },
                    },
                },
            },
        },
    });

    // 寻找第一个未完成的课时
    const firstUncompletedLesson = unitsInActiveCourse
        // flatMap() 函数用于将每个课程单元的课程（lessons）抽取出来，并将它们合并为一个新的扁平化的数组。
        .flatMap((unit) => unit.lessons)
        .find((lesson) => {
            return lesson.challenges.some((challenge) => {
                return !challenge.challengeProgress
                    || challenge.challengeProgress.length === 0
                    || challenge.challengeProgress.some((progress) => progress.completed === false)
            });
        });

    return {
        activeLesson: firstUncompletedLesson,
        activeLessonId: firstUncompletedLesson?.id,
    };
});

export const getLesson = cache(async (id?: number) => {
    const { userId } = await auth();

    if (!userId) return null;

    const courseProgress = await getCourseProgress();
    const lessonId = id || courseProgress?.activeLessonId;

    if (!lessonId) return null;

    const data = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
            challenges: {
                orderBy: (challenges, { asc }) => [asc(challenges.order)],
                with: {
                    challengeOptions: true,
                    challengeProgress: {
                        where: eq(challengeProgress.userId, userId),
                    },
                },
            },
        },
    });

    if (!data || !data.challenges) {
        return null;
    }

    // 计算每个挑战是否已完成
    const normalizedChallenges = data.challenges.map((challenge) => {
        const completed = challenge.challengeProgress
            && challenge.challengeProgress.length > 0
            && challenge.challengeProgress.every((progress) => progress.completed)

        return { ...challenge, completed };
    });

    // 包含课程信息和处理后的挑战信息的对象
    return { ...data, challenges: normalizedChallenges }
});

export const getLessonPercentage = cache(async () => {
    const courseProgress = await getCourseProgress();

    if (!courseProgress?.activeLessonId) {
        return 0;
    }

    // 返回某个课时的
    const lesson = await getLesson(courseProgress.activeLessonId);

    if (!lesson) {
        return 0;
    }

    const completedChallenges = lesson.challenges
        .filter((challenge) => challenge.completed);
    const percentage = Math.round(
        (completedChallenges.length / lesson.challenges.length) * 100,
    );

    return percentage;
});

// 订阅 stripe
// 一天的毫秒数
const DAY_IN_MS = 86_400_000
export const getUserSubscription = cache(async () => {
    const { userId } = await auth()

    if (!userId) return null

    const data = await db.query.userSubscription.findFirst({
        where: eq(userSubscription.userId, userId)
    })

    if (!data) return null
    // 判断用户订阅是否还有效
    // 计算了用户订阅的当前周期结束时间加上一天的毫秒数是否大于当前时间，有一定的缓冲
    const isActive = data.stripePriceId &&
        data.stripeCurrentPeriodEnd?.getTime() + DAY_IN_MS > Date.now()

    return {
        ...data,
        isActive: !!isActive
    }
})

export const getTopTenUsers = cache(async () => {
    const { userId } = await auth()

    if (!userId) return []

    const data = await db.query.userProgress.findMany({
        orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
        limit: 10,
        columns: {
            userId: true,
            userName: true,
            userImageSrc: true,
            points: true
        }
    })
    return data
})