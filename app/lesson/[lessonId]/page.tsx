// 实现：点击已完成的挑战，可以进行挑战
import { redirect } from "next/navigation";

import { getLesson, getUserProgress } from "@/db/queries";

import { Quiz } from "../quiz";

type Props = {
    params: {
        lessonId: number
    }
}

const LessonIdPage = async ({
    params
}: Props) => {
    const lessonData = getLesson(params.lessonId);
    const userProgressData = getUserProgress();
    // const userSubscriptionData = getUserSubscription();

    const [
        lesson,
        userProgress,
        // userSubscription,
    ] = await Promise.all([
        lessonData,
        userProgressData,
        // userSubscriptionData,
    ]);

    if (!lesson || !userProgress) {
        redirect("/learn");
    }

    const initialPercentage = lesson.challenges
        .filter((challenge) => challenge.completed)
        .length / lesson.challenges.length * 100;

    return (
        <Quiz
            initialLessonId={lesson.id}
            initialLessonChallenges={lesson.challenges}
            initialHearts={userProgress.hearts}
            initialPercentage={initialPercentage}
            userSubscription={null}
        />
    );
};

export default LessonIdPage;