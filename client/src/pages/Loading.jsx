import React, { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const Loading = () => {
  const navigate = useNavigate()
  const { fetchUser, axios, token } = useAppContext()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const verifyPayment = async () => {
      const transactionId = searchParams.get('transactionId')

      if (!transactionId) {
        // Not from payment → redirect home
        navigate('/', { replace: true })
        return
      }

      try {
        // Verify payment and add credits directly
        const { data } = await axios.post('/api/credit/verify',
          { transactionId },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (data.success) {
          await fetchUser() // Refresh user to show new credits
          toast.success(`${data.credits} credits added successfully! 🎉`)
        } else {
          toast.error(data.message || 'Payment verification failed')
        }
      } catch (error) {
        toast.error('Payment verification failed')
      } finally {
        navigate('/', { replace: true })
      }
    }

    // Wait 3 seconds for Stripe to process
    const timeout = setTimeout(() => {
      verifyPayment()
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className='bg-gradient-to-b from-[#531B81] to-[#29184B] flex flex-col
    items-center justify-center h-screen w-screen text-white gap-4'>
      <div className='w-10 h-10 rounded-full border-4 border-white
      border-t-transparent animate-spin'></div>
      <p className='text-lg'>Processing your payment...</p>
      <p className='text-sm opacity-70'>Please wait, do not close this page</p>
    </div>
  )
}

export default Loading