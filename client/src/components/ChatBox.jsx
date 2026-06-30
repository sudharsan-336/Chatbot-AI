import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';
import toast from 'react-hot-toast';

const ChatBox = () => {
  const containerRef = useRef(null);

  // Stores the previously selected chat ID to detect chat changes
  const prevChatId = useRef(null);

  const {
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    theme,
    user,
    axios,
    token,
    setUser
  } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);

  // Handles sending a new message
  const onSubmit = async (e) => {
    e.preventDefault();

    // Check if the user is logged in
    if (!user) {
      return toast.error('Login to send a message');
    }

    // Ensure a chat is selected
    if (!selectedChat || !selectedChat._id) {
      return toast.error('Please select or create a chat first!');
    }

    // Check if the user has enough credits
    if (user.credits <= 0) {
      return toast.error('You do not have enough credits!');
    }

    const promptCopy = prompt;
    setPrompt('');

    // Deduct one credit immediately for a better user experience
    setUser(prev => ({
      ...prev,
      credits: prev.credits - 1
    }));

    setLoading(true);

    // Display the user's message immediately
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: promptCopy,
        timestamp: Date.now(),
        isImage: mode === 'image'
      }
    ]);

    try {
      const { data } = await axios.post(
        `/api/message/${mode}`,
        {
          chatId: selectedChat._id,
          prompt: promptCopy,
          isPublished
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {

        // Add the AI response to the chat window
        setMessages(prev => [...prev, data.reply]);

        // Create an updated message list
        const updatedMessages = [
          ...(selectedChat.messages || []),
          {
            role: 'user',
            content: promptCopy,
            timestamp: Date.now(),
            isImage: mode === 'image'
          },
          data.reply
        ];

        // Save the current chat ID before updating state
        prevChatId.current = selectedChat._id;

        // Update the selected chat with the latest messages
        setSelectedChat(prev => ({
          ...prev,
          messages: updatedMessages
        }));

        // Update the chat list
        setChats(prev =>
          prev.map(chat =>
            chat._id === selectedChat._id
              ? {
                ...chat,
                messages: updatedMessages
              }
              : chat
          )
        );

      } else {

        // Restore the credit if the request fails
        toast.error(data.message || 'Failed to send message');

        setUser(prev => ({
          ...prev,
          credits: prev.credits + 1
        }));

        // Restore the prompt text
        setPrompt(promptCopy);

        // Remove the optimistic user message
        setMessages(prev => prev.slice(0, -1));
      }

    } catch (error) {

      // Handle network or server errors
      toast.error(
        error?.response?.data?.message ||
        error.message ||
        'Something went wrong'
      );

      // Restore the deducted credit
      setUser(prev => ({
        ...prev,
        credits: prev.credits + 1
      }));

      // Restore the prompt text
      setPrompt(promptCopy);

      // Remove the optimistic user message
      setMessages(prev => prev.slice(0, -1));

    } finally {

      // Stop the loading animation
      setLoading(false);
    }
  };

  // Load messages only when a different chat is selected
  useEffect(() => {
    if (selectedChat?._id !== prevChatId.current) {
      prevChatId.current = selectedChat?._id;

      if (selectedChat?.messages) {
        setMessages(selectedChat.messages);
      } else {
        setMessages([]);
      }
    }
  }, [selectedChat]);

  // Automatically scroll to the latest message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <div className='flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-28 max-md:mt-14 2xl:pr-40'>

      <div
        ref={containerRef}
        className='flex-1 mb-5 overflow-y-scroll'
      >
        {!selectedChat ? (
          <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
            <img
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              alt=''
              className='w-full max-w-56 sm:max-w-68'
            />

            <p className='mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>
              Ask me anything.
            </p>

            <p className='text-sm text-gray-400'>
              Create a new chat to get started
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className='h-full flex flex-col items-center justify-center gap-2 text-primary'>
            <img
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              alt=''
              className='w-full max-w-56 sm:max-w-68'
            />

            <p className='mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white'>
              Ask me anything.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Message key={index} message={message} />
          ))
        )}

        {loading && (
          <div className='loader flex items-center gap-1.5'>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce animation-delay-200'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce animation-delay-400'></div>
          </div>
        )}
      </div>

      {mode === 'image' && (
        <label className='inline-flex items-center gap-2 mb-3 text-sm mx-auto'>
          <p className='text-xs'>
            Publish Generated Image to Community
          </p>

          <input
            type='checkbox'
            className='cursor-pointer'
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      <form
        onSubmit={onSubmit}
        className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'
      >
        <select
          value={mode}
          onChange={e => setMode(e.target.value)}
          className='text-sm pl-3 pr-2 outline-none'
        >
          <option className='dark:bg-purple-900' value='text'>
            Text
          </option>

          <option className='dark:bg-purple-900' value='image'>
            Image
          </option>
        </select>

        <input
          type='text'
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder='Type your prompt here...'
          className='flex-1 w-full text-sm outline-none'
          required
        />

        <button type='submit' disabled={loading}>
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className='w-8 cursor-pointer'
            alt=''
          />
        </button>
      </form>

    </div>
  );
};

export default ChatBox;
