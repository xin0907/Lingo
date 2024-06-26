import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { isAdmin } from "@/lib/admin";

// admin courses 的 api
// 可能会遇到跨域问题，去 next.config.msj 修改
export const GET = async () => {
    if (!isAdmin()) return new NextResponse("Unauthorized", { status: 401 })

    const data = await db.query.courses.findMany()
    return NextResponse.json(data)
}

export const POST = async (req: Request) => {
    if (!isAdmin()) return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()

    const data = await db.insert(courses).values({
        ...body
    }).returning()

    return NextResponse.json(data[0])
}
