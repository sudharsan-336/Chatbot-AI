import React, { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Loading = () => {
  const navigate = useNavigate()
  const { fetchUser, fetchUserChats } = useAppContext()

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Refresh user data to get updated credits
        await fetchUser();
        await fetchUserChats();
        toast.success('Credits added successfully! 🎉');
      } catch (error) {
        toast.error('Payment verification failed');
      } finally {
        // Navigate home after verification
        navigate('/');
      }
    }

    // Wait 5 seconds for Stripe webhook to process
    const timeout = setTimeout(() => {
      verifyPayment();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className='bg-gradient-to-b from-[#531B81] to-[#29184B] flex flex-col items-center justify-center h-screen w-screen text-white gap-4'>
      <div className='w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin'></div>
      <p className='text-lg'>Processing your payment...</p>
      <p className='text-sm opacity-70'>Please wait, do not close this page</p>
    </div>
  )
}

export default Loading