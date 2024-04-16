import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";

// 可能会遇到跨域问题，去 next.config.msj 修改
export const GET = async () => {
    const data = await db.query.courses.findMany()
    return NextResponse.json(data)
}
