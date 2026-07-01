import React, { useEffect } from 'react';
import { assets } from '../assets/assets';
import moment from 'moment';
import Markdown from 'react-markdown';
import Prism from 'prismjs';

const Message = ({ message }) => {

  // Highlight code blocks whenever the message content changes
  useEffect(() => {
    Prism.highlightAll();
  }, [message]);

  // Common timestamp style
  const timeStyle = 'text-xs text-gray-400 dark:text-[#B1A6C0]';

  return (
    <div>

      {/* Render user message */}
      {message.role === 'user' ? (
        <div className='flex items-start justify-end gap-2 my-4'>

          <div
            className='flex flex-col gap-2 p-2 px-4 max-w-2xl
            bg-slate-50 dark:bg-[#57317C]/30
            border border-[#80609F]/30 rounded-md'
          >
            <p className='text-sm dark:text-primary'>
              {message.content}
            </p>

            {/* Display message timestamp */}
            <span className={timeStyle}>
              {moment(message.timestamp).fromNow()}
            </span>
          </div>

          {/* User profile icon */}
          <img
            src={assets.user_icon}
            alt="User"
            className='w-8 rounded-full'
          />

        </div>
      ) : (

        /* Render AI message */
        <div
          className='inline-flex flex-col gap-2 p-2 px-4 my-4 max-w-2xl
          bg-primary/20 dark:bg-[#57317C]/30
          border border-[#80609F]/30 rounded-md'
        >

          {/* Display generated image */}
          {message.isImage ? (
            <img
              src={message.content}
              alt="Generated"
              className='w-full max-w-md mt-2 rounded-md'
            />
          ) : (

            /* Render markdown response */
            <div className='text-sm dark:text-primary reset-tw'>
              <Markdown>
                {message.content}
              </Markdown>
            </div>
          )}

          {/* Display message timestamp */}
          <span className={timeStyle}>
            {moment(message.timestamp).fromNow()}
          </span>

        </div>
      )}

    </div>
  );
};

export default Message;
