import { Outlet, useLocation, useNavigate } from "react-router-dom"
import "../../styles/admin/AdminLayout.css"
import SidebarLayout from "../layout/SidebarLayout"
import RoleSidebar from "../layout/RoleSidebar"
import { BarChart3, Eye, LayoutDashboard, Users } from "lucide-react"
import { displayLocalPart, getSessionEmail } from "../../utils/emailIdentity"
import { notify } from "../../utils/notifications"

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = () => {
    localStorage.removeItem("role")
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    localStorage.removeItem("email")
    notify.info("Logged out successfully.", { toastId: "logout-success" })
    navigate("/login")
  }

  const role = localStorage.getItem("role") || "admin"
  const sessionEmail = getSessionEmail()
  const displayId = displayLocalPart(sessionEmail) || "—"
  const shownLocal = displayLocalPart(sessionEmail)
  const avatarLetter = (shownLocal ? shownLocal.charAt(0) : sessionEmail ? sessionEmail.charAt(0) : "•").toUpperCase()
  const navItems =
    role === "sme"
      ? [
          { path: "/sme/dashboard", label: "Dashboard", Icon: LayoutDashboard },
          { path: "/sme/challenges", label: "Manage Challenges", Icon: Eye },
          { path: "/sme/reports", label: "Reports", Icon: BarChart3 },
        ]
      : [
          { path: "/admin", label: "Dashboard", Icon: LayoutDashboard },
          { path: "/admin/users", label: "User Management", Icon: Users },
          { path: "/admin/challenges", label: "Challenges", Icon: Eye },
          { path: "/admin/reports", label: "Reports", Icon: BarChart3 },
        ]

  const isActiveRoute = (path) => {
    const pathname = location.pathname.replace(/\/+$/, "") || "/"
    if (path === "/sme/dashboard") return pathname === "/sme" || pathname === "/sme/dashboard"
    return pathname === path
  }

  return (
    <SidebarLayout
      className="admin-layout-shell"
      sidebarClassName="admin-sidebar"
      mainClassName="admin-main"
      scrollClassName="admin-page-scroll"
      sidebarWidth="72px"
      contentMaxWidth="min(1680px, 100%)"
      sidebar={
        <RoleSidebar
          avatarLetter={avatarLetter}
          displayId={displayId}
          isActiveRoute={isActiveRoute}
          navItems={navItems}
          onLogout={logout}
          variant="admin"
        />
      }
    >
      <Outlet />
    </SidebarLayout>
  )
}

export default AdminLayout
