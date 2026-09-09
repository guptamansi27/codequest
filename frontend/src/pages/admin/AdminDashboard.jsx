import { Routes, Route } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import Dashboard from "../../components/admin/Dashboard"
import UserManagement from "../../components/admin/UserManagement"
import Reports from "../../components/admin/Reports"
import ChallengeDashboard from "../../components/admin/ChallengeDashboard"
import NotFoundPage from "../public/NotFoundPage"

const AdminDashboard = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="challenges" element={<ChallengeDashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="viewChallenges" element={<ChallengeDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AdminDashboard
