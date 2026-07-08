import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

// Set the base URL for all Axios requests
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

// Create the application context
const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  // Application state
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [token, _setToken] = useState(localStorage.getItem("token") || null);

  // Tracks whether user information is being loaded
  const [loadingUser, setLoadingUser] = useState(true);

  /**
   * Updates the authentication token
   * and synchronizes it with localStorage.
   */
  const setToken = (newToken) => {
    _setToken(newToken);

    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
  };

  /**
   * Fetches the authenticated user's data
   * from the server.
   */
  const fetchUser = async () => {
    if (!token) {
      return setLoadingUser(false);
    }

    setLoadingUser(true);

    try {
      const { data } = await axios.get("/api/user/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      toast.error(error.message);
      setUser(null);
      setToken(null);
    } finally {
      // Stop loading regardless of success or failure
      setLoadingUser(false);
    }
  };

  /**
   * Retrieves all chats belonging
   * to the authenticated user.
   */
  const fetchUserChats = async () => {
    if (!token) return;

    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setChats(data.chats);
        setSelectedChat(data.chats[0] || null);
      } else {
        toast.error(data.message);
        setChats([]);
        setSelectedChat(null);
      }
    } catch (error) {
      toast.error(error.message);
      setChats([]);
      setSelectedChat(null);
    }
  };

  /**
   * Creates a new chat session
   * and refreshes the chat list.
   */
  const createNewChat = async () => {
    if (!user) {
      return toast.error("Login to create a new chat");
    }

    try {
      await axios.get("/api/chat/create", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchUserChats();
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  /**
   * Applies the selected theme
   * and stores it in localStorage.
   */
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  /**
   * Loads user information and chats
   * whenever the authentication token changes.
   * Clears the application state if the user logs out.
   */
  useEffect(() => {
    if (token) {
      fetchUser();
      fetchUserChats();
    } else {
      setUser(null);
      setChats([]);
      setSelectedChat(null);
      setLoadingUser(false);
    }
  }, [token]);

  // Values shared across the application
  const value = {
    navigate,
    user,
    setUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    token,
    setToken,
    createNewChat,
    loadingUser,
    fetchUser,
    fetchUserChats,
    axios,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for accessing the application context
export const useAppContext = () => useContext(AppContext);