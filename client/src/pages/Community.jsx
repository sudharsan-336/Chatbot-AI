import React, { useEffect, useState } from 'react'
import Loading from './Loading'
import { useAppContext } from '../context/AppContext.jsx'
import toast from 'react-hot-toast'

const Community = () => {

  // Stores published community images
  const [images, setImages] = useState([])

  // Handles loading state while fetching images
  const [loading, setLoading] = useState(true)

  // Access axios instance from app context
  const { axios } = useAppContext();


  // Fetch published images from backend
  const fetchImages = async () => {
    try {

      const { data } = await axios.get('/api/user/published-images');

      if (data.success) {

        // Update state with fetched images
        setImages(data.images);

      } else {

        toast.error(data.message);
      }

    } catch (error) {

      toast.error(error.message);

    }

    setLoading(false);
  }


  // Fetch images when component loads
  useEffect(() => {
    fetchImages()
  }, [])


  // Show loader until images are fetched
  if (loading) return <Loading />


  return (
    <div className='p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full overflow-y-scroll'>

      {/* Community images heading */}
      <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-purple-100'>
        Community Images
      </h2>


      {images.length > 0 ? (

        <div className='flex flex-wrap max-sm:justify-center gap-5'>

          {/* Display all published images */}
          {images.map((item, index) => (

            <a
              key={index}
              href={item.imageUrl}
              target='_blank'
              rel="noreferrer"
              className='relative group block rounded-lg overflow-hidden border 
              border-gray-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow duration-300'
            >

              <img
                src={item.imageUrl}
                alt='community'
                className='w-full h-40 md:h-50 2xl:h-62 object-cover 
                group-hover:scale-105 transition-transform duration-300 ease-in-out'
              />


              {/* Shows image creator name on hover */}
              <p className='absolute bottom-0 right-0 text-xs bg-black/50 backdropblur text-white px-4 
              py-1 rounded-t-xl opacity-0 group-hover:opacity-100 transition duration-300'>

                Created by {item.userName}

              </p>

            </a>

          ))}

        </div>

      ) : (

        // Display message when no images are available
        <p className='text-center text-gray-600 dark:text-purple-200 mt-10'>
          No Images Available.
        </p>

      )}

    </div>
  )
}

export default Community