import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [token, _setToken] = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser] = useState(true); // ✅ starts true

  const setToken = (newToken) => {
    _setToken(newToken);
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
  };

  const fetchUser = async () => {
    if (!token) return setLoadingUser(false);
    setLoadingUser(true);
    try {
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
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
      setLoadingUser(false); // ✅ always runs
    }
  };

  const fetchUserChats = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: { Authorization: `Bearer ${token}` },
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

  const createNewChat = async () => {
    if (!user) return toast.error("Login to create a new chat");
    try {
      await axios.get("/api/chat/create", {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUserChats();
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Theme handler
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ✅ FIXED: Single useEffect — no duplicate calls
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);