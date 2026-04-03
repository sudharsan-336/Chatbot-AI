import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import { Route, Routes } from 'react-router-dom'
import ChatBox from './components/ChatBox'
import Credits from './pages/Credits'
import Community from './pages/Community'
import Loading from './pages/Loading'
import Login from './pages/Login' // ✅ ADD THIS
import { assets } from './assets/assets'
import './assets/prism.css'
import { useAppContext } from './context/AppContext'

const App = () => {

  const { user } = useAppContext()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

return (
  <>
    {/* Public Route: Loading page (works always) */}
    <Routes>
      <Route path='/loading' element={<Loading />} />
    </Routes>

    {/* Existing UI (UNCHANGED LOGIC) */}
    {!isMenuOpen && (
      <img
        src={assets.menu_icon}
        className='absolute top-3 left-3 w-8 h-8 cursor-pointer md:hidden not-dark:invert'
        onClick={() => setIsMenuOpen(true)}
        alt="menu"
      />
    )}

    {user ? (
      <div className='dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white'>
        <div className='flex h-screen w-screen'>

          {/* Sidebar */}
          <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

          {/* Protected Routes */}
          <Routes>
            <Route path='/' element={<ChatBox />} />
            <Route path='/credits' element={<Credits />} />
            <Route path='/community' element={<Community />} />
          </Routes>

        </div>
      </div>
    ) : (
      <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen'>
        <Login />
      </div>
    )}
  </>
)
}

export default App