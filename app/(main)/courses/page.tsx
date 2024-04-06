import { getCourses, getUserProgress } from "@/db/queries"
import { List } from "./list"

const CoursesPage = async () => {
    const coursesData = getCourses()
    const userProgressData = getUserProgress()

    const [courses, userProgress] = await Promise.all([
        coursesData, userProgressData
    ])
    // const courses = [
    //     { id: 1, title: "Spanish", imageSrc: "/es.svg" },
    //     { id: 2, title: "French", imageSrc: "/fr.svg" },
    //     { id: 3, title: "Croatian", imageSrc: "/hr.svg" },
    //     { id: 4, title: "Italian", imageSrc: "/it.svg" },
    // ]
    return (
        <div className="h-full max-w-[912px] px-3 mx-auto">
            <h1 className="text-2xl font-bold text-neutral-700">
                Language Courses
            </h1>
            <List courses={courses} activeCourseId={userProgress?.activeCourseId} />
        </div>
    )
}

export default CoursesPage