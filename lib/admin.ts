import { auth } from "@clerk/nextjs"

// 判断是否为当前用户，才能进页面
const adminIds = [
    "user_2eUwejjgF2uThbp3wp6db2Ve3BK"
]

export const isAdmin = () => {
    const { userId } = auth()

    if (!userId) return false

    return adminIds.indexOf(userId) !== -1
}