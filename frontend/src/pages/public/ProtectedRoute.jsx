import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children, role }) => {
  const storedUser = localStorage.getItem("user")

  if (!storedUser) {
    return <Navigate to="/login" replace />
  }

  const user = JSON.parse(storedUser)

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
