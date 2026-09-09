import React from 'react'
import { UserLayout } from '../../components/user/UserLayout'
import Dashboard from './Dashboard'
import Challenges from './Challenges'
import Galaxy from './Galaxy'
import ChallengeDetail from './ChallengeDetail'
import Test from './Test'
import CodeOfTheDay from './CodeOfTheDay'
import Leaderboard from './Leaderboard'
import Reports from './Reports'
import NotFoundPage from '../public/NotFoundPage'
import { ArrowLeft } from 'lucide-react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const ChallengeStandaloneLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isGalaxyHome =
    location.pathname === '/user/galaxy' ||
    location.pathname === '/galaxy' ||
    location.pathname === '/user/challenges'
  const isInsideGalaxy =
    isGalaxyHome ||
    location.pathname.startsWith('/user/galaxy/') ||
    location.pathname.startsWith('/galaxy/')
  const isInsideChallenge =
    location.pathname.startsWith('/user/challenge/') ||
    location.pathname.startsWith('/challenge/')
  const returnTarget = isGalaxyHome ? '/user/dashboard' : isInsideGalaxy ? '/user/galaxy' : '/user/dashboard'
  const returnLabel = isGalaxyHome ? 'Dashboard' : isInsideGalaxy ? 'Galaxies' : 'Dashboard'

  return (
    <div className="user-challenge-standalone">
      {!isInsideChallenge && (
        <button
          type="button"
          className="challenge-dashboard-return"
          onClick={() => navigate(returnTarget)}
        >
          <ArrowLeft />
          {returnLabel}
        </button>
      )}
      <Outlet />
    </div>
  )
}

const UserDashboard = () => {
  return (
    <Routes>
    <Route element={<ChallengeStandaloneLayout />}>
    <Route path={"galaxy"} element={<Challenges/>}/>
    <Route path={"galaxy/:type"} element={<Galaxy/>}/>
    <Route path={"challenge/:id"} element={<ChallengeDetail/>}/>
    <Route path={"challenges"} element={<Navigate to="/user/galaxy" replace />}/>
    <Route path={"test/:assessmentId"} element={<Test/>}/>
    </Route>
    <Route path={"code-of-the-day/challenge/:id"} element={<ChallengeDetail/>}/>
    <Route element={<UserLayout />}>
    <Route index element={<Dashboard/>}/>
    <Route path={"dashboard"} element={<Dashboard/>}/>
    <Route path={"test"} element={<Test/>}/>
    <Route path={"code-of-the-day"} element={<CodeOfTheDay/>}/>
    <Route path={"leaderboard"} element={<Leaderboard/>}/>
    <Route path={"reports"} element={<Reports/>}/>
    <Route path={"*"} element={<NotFoundPage/>}/>
    </Route>
  </Routes>
  )
}

export default UserDashboard
