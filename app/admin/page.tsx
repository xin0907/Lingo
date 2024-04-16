import dynamic from "next/dynamic"
import { isAdmin } from "@/lib/admin"
import { redirect } from "next/navigation"

const App = dynamic(() => import("./app"), { ssr: false })

const AdminPage = () => {
    if (!isAdmin()) redirect("/")

    return (
        <div>
            <App />
        </div>
    )
}

export default AdminPage
