import { Navigate, Routes, Route } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import ChallengeDashboard from "../../components/admin/ChallengeDashboard"
import SMEDashboardHome from "../../components/sme/SMEDashboardHome"
import SMEReports from "../../components/sme/SMEReports"
import NotFoundPage from "../public/NotFoundPage"

const SMEDashboard = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SMEDashboardHome />} />
        <Route path="challenges/create" element={<Navigate to="../challenges" replace />} />
        <Route path="challenges" element={<ChallengeDashboard />} />
        <Route path="reports" element={<SMEReports />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default SMEDashboard
