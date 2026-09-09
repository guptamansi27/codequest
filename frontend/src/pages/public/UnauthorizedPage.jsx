import { useNavigate } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import "../../styles/public/UnauthorizedPage.css"

const UnauthorizedPage = () => {
  const navigate = useNavigate()
  const role = "admin"

  const handleGoBack = () => {
    if (role === "admin") {
      navigate("/admin")
    } else if (role === "user") {
      navigate("/user")
    } else {
      navigate("/")
    }
  }

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-icon">
          <ShieldAlert />
        </div>
        <h1>Access Denied</h1>
        <p className="unauthorized-message">
          You don&apos;t have permission to access this page.
        </p>
        <p className="unauthorized-hint">
          Your current role is: <strong>{role || "Unknown"}</strong>
        </p>
        <button className="unauthorized-btn" onClick={handleGoBack}>
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default UnauthorizedPage
