import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext.jsx'
import toast from 'react-hot-toast'

// Skeleton loader component displayed while credit plans are loading
const PlanSkeleton = () => (
  <div className='border border-gray-200 dark:border-purple-700 rounded-lg 
  shadow p-6 w-[300px] flex flex-col gap-4 animate-pulse'>
    <div className='h-6 bg-gray-200 dark:bg-purple-800/40 rounded w-1/2' />
    <div className='h-8 bg-gray-200 dark:bg-purple-800/40 rounded w-3/4' />
    <div className='space-y-2'>
      <div className='h-4 bg-gray-200 dark:bg-purple-800/40 rounded' />
      <div className='h-4 bg-gray-200 dark:bg-purple-800/40 rounded' />
      <div className='h-4 bg-gray-200 dark:bg-purple-800/40 rounded w-3/4' />
    </div>
    <div className='h-10 bg-gray-200 dark:bg-purple-800/40 rounded mt-auto' />
  </div>
)

const Credits = () => {

  // Stores available credit plans fetched from the server
  const [plans, setPlans] = useState([])

  // Controls loading state while fetching credit plans
  const [loading, setLoading] = useState(true)

  const { token, axios } = useAppContext();

  // Fetch credit plans when the component mounts
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axios.get('/api/credit/plans');

        if (data.success) {
          setPlans(data.plans);
        } else {
          toast.error(data.message || "Failed to fetch plans");
        }

      } catch (error) {
        toast.error(error.message);

      } finally {
        // Hide loader after API request completes
        setLoading(false);
      }
    }

    fetchPlans()
  }, [])

  // Handles credit plan purchase and redirects user to payment page
  const purchasePlan = async (planId) => {
    try {
      const { data } = await axios.post(
        '/api/credit/purchase',
        { planId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {

        // Store payment status before redirecting
        sessionStorage.setItem('fromPayment', 'true')

        // Redirect user to payment gateway
        window.location.href = data.url;

      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className='max-w-7xl h-screen overflow-y-scroll mx-auto px-4 sm:px-6 lg:px-8 py-12'>

      <h2 className='text-3xl font-semibold text-center mb-10 text-gray-800 dark:text-white'>
        Credit Plans
      </h2>

      {/* Display skeleton loaders while plans are being fetched */}
      {loading ? (

        <div className='flex flex-wrap justify-center gap-8'>
          {[...Array(3)].map((_, i) => (
            <PlanSkeleton key={i} />
          ))}
        </div>

      ) : plans.length === 0 ? (

        // Display message when no credit plans are available
        <p className='text-center text-gray-500 dark:text-purple-200 mt-10'>
          No plans available right now. Please try again later.
        </p>

      ) : (

        // Render available credit plans
        <div className='flex flex-wrap justify-center gap-8'>

          {plans.map((plan) => (

            <div
              key={plan._id}
              className={`border border-gray-200 dark:border-purple-700 rounded-lg shadow
              hover:shadow-lg transition-shadow p-6 w-[300px] flex flex-col
              ${plan._id === "pro"
                  ? "bg-purple-50 dark:bg-purple-900"
                  : "bg-white dark:bg-transparent"
                }`}
            >

              <div className='flex-1'>

                {/* Display plan details */}
                <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  {plan.name}
                </h3>

                <p className='text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4'>
                  ${plan.price}
                  <span className='text-base font-normal text-gray-600 dark:text-purple-200'>
                    {' '}/ {plan.credits} Credits
                  </span>
                </p>

                {/* Display features included in the plan */}
                <ul className='list-disc list-inside text-sm text-gray-700 dark:text-purple-200 space-y-1'>
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>

              </div>

              {/* Purchase button with loading notification */}
              <button
                onClick={() => toast.promise(
                  purchasePlan(plan._id),
                  { loading: "Processing..." }
                )}
                className='mt-6 bg-purple-600 hover:bg-purple-700 active:bg-purple-800
                text-white font-medium py-2 rounded transition-colors cursor-pointer'
              >
                Buy Now
              </button>

            </div>

          ))}

        </div>
      )}

    </div>
  )
}

export default Credits