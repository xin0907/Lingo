import { getCourses } from "@/db/queries"
import { List } from "./list"

const CoursesPage = async () => {
    // const courses = await getCourses()
    const courses = [
        { id: 1, title: "Spanish", imageSrc: "/es.svg" },
        { id: 2, title: "French", imageSrc: "/fr.svg" },
        { id: 3, title: "Croatian", imageSrc: "/hr.svg" },
        { id: 4, title: "Italian", imageSrc: "/it.svg" },
    ]
    return (
        <div className="h-full max-w-[912px] px-3 mx-auto">
            <h1 className="text-2xl font-bold text-neutral-700">
                Language Courses
            </h1>
            <List courses={courses} activeCourseId={1} />
        </div>
    )
}

export default CoursesPage