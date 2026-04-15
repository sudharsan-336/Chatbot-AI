import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { Route, Routes, Navigate } from 'react-router-dom';
import ChatBox from './components/ChatBox';
import Credits from './pages/Credits';
import Community from './pages/Community';
import Loading from './pages/Loading';
import Login from './pages/Login';
import { assets } from './assets/assets';
import './assets/prism.css';
import { useAppContext } from './context/AppContext';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const { user, loadingUser } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-b from-[#242124] to-[#000000]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />

      {user && !isMenuOpen && (
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
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <Routes>
              <Route path='/' element={<ChatBox />} />
              <Route path='/credits' element={<Credits />} />
              <Route path='/community' element={<Community />} />
              {/* FIX: Only show /loading if fromPayment flag is set */}
              <Route
                path='/loading'
                element={
                  sessionStorage.getItem('fromPayment') === 'true'
                    ? <Loading />
                    : <Navigate to='/' replace />
                }
              />
            </Routes>
          </div>
        </div>
      ) : (
        <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen'>
          <Login />
        </div>
      )}
    </>
  );
};

export default App;