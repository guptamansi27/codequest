import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../../styles/user/index.css";
import SidebarLayout from "../layout/SidebarLayout";
import RoleSidebar from "../layout/RoleSidebar";

import {
  LayoutDashboard,
  Globe,
  Calendar,
  BarChart3,
  FileBarChart,
  FileText,
} from "lucide-react";
import { displayLocalPart, getSessionEmail } from "../../utils/emailIdentity";
import { notify } from "../../utils/notifications";

const menuItems = [
  { Icon: LayoutDashboard, label: "Dashboard", path: "/user/dashboard" },
  { Icon: Globe, label: "Galaxy", path: "/user/galaxy" },
  { Icon: FileText, label: "Test", path: "/user/test" },
  { Icon: Calendar, label: "Code of the Day", path: "/user/code-of-the-day" },
  { Icon: BarChart3, label: "Leaderboard", path: "/user/leaderboard" },
  { Icon: FileBarChart, label: "Reports", path: "/user/reports" },
];

export function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionEmail = getSessionEmail();
  const shownLocal = displayLocalPart(sessionEmail);
  const displayId = shownLocal || "User";
  const avatarLetter = (shownLocal ? shownLocal.charAt(0) : sessionEmail ? sessionEmail.charAt(0) : "U").toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("role");
    localStorage.removeItem("refresh");
    localStorage.removeItem("email");
    notify.info("Logged out successfully.", { toastId: "logout-success" });
    navigate("/login", { replace: true });
  };

  const isActiveRoute = (path) =>
    path === "/user/dashboard"
      ? location.pathname === "/user" || location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <SidebarLayout
      className="cq-app-shell"
      sidebarClassName="cq-sidebar"
      mainClassName="cq-main"
      scrollClassName="cq-page-scroll"
      sidebarWidth="72px"
      contentMaxWidth="min(1680px, 100%)"
      sidebar={
        <RoleSidebar
          avatarLetter={avatarLetter}
          displayId={displayId}
          isActiveRoute={isActiveRoute}
          navItems={menuItems}
          onLogout={handleLogout}
          variant="user"
        />
      }
    >
      <Outlet />
    </SidebarLayout>
  );
}

export default UserLayout;
