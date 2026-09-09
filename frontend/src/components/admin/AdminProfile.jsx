import { useState } from "react"
import { CalendarDays, Code2, FileText, Users } from "lucide-react"
import { displayLocalPart, getSessionEmail } from "../../utils/emailIdentity"
import "../../styles/admin/AdminProfile.css"

const AdminProfile = () => {
  const sessionEmail = getSessionEmail()
  const [activeTab, setActiveTab] = useState("profile")

  const adminData = {
    email: sessionEmail || "—",
    employeeId: displayLocalPart(sessionEmail) || "—",
    role: "Administrator",
    joinDate: "2024-01-01",
    totalUsers: 156,
    activeChallenges: 24,
    totalAssessments: 12,
  }

  const stats = [
    { label: "Total Users", value: adminData.totalUsers, icon: Users },
    { label: "Active Challenges", value: adminData.activeChallenges, icon: Code2 },
    { label: "Assessments", value: adminData.totalAssessments, icon: FileText },
    { label: "Days Active", value: 486, icon: CalendarDays },
  ]

  const recentActivity = [
    { action: "Created new challenge", type: "Challenge", time: "2 hours ago" },
    { action: "Updated user permissions", type: "User", time: "5 hours ago" },
    { action: "Generated report", type: "Report", time: "1 day ago" },
    { action: "Added new TA", type: "User", time: "2 days ago" },
  ]

  return (
    <div className="admin-profile">
      <header className="profile-header-section">
        <div className="profile-cover"></div>
        <div className="profile-info">
          <div className="profile-avatar-large">
            {(displayLocalPart(sessionEmail) || sessionEmail || "—").charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h1>{adminData.email}</h1>
            <p className="profile-role">{adminData.role}</p>
            <div className="profile-meta">
              <span><strong>Employee ID:</strong> {adminData.employeeId}</span>
              <span><strong>Joined:</strong> {adminData.joinDate}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div key={stat.label} className="stat-card-minimal">
              <span className="stat-icon"><Icon /></span>
              <div className="stat-content">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "profile" && (
            <div className="profile-details-section">
              <div className="detail-card">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Email Address</label>
                    <span>{adminData.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Employee ID</label>
                    <span>{adminData.employeeId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Role</label>
                    <span>{adminData.role}</span>
                  </div>
                  <div className="detail-item">
                    <label>Join Date</label>
                    <span>{adminData.joinDate}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span className="status-active">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="activity-section">
              <div className="activity-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {recentActivity.map((activity) => (
                    <div key={`${activity.action}-${activity.time}`} className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <span className="activity-action">{activity.action}</span>
                        <span className="activity-type">{activity.type}</span>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-section">
              <div className="settings-card">
                <h3>Account Settings</h3>
                <div className="settings-list">
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Email Notifications</span>
                      <span className="setting-desc">Receive email updates for important activities</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Two-Factor Authentication</span>
                      <span className="setting-desc">Add an extra layer of security to your account</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <span className="setting-label">Dark Mode</span>
                      <span className="setting-desc">Switch between light and dark themes</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProfile
