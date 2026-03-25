import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChats, dummyUserData } from "../assets/assets";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Fetch Chats
    const fetchChats = async () => {
        setChats(dummyChats);
    };

    // Fetch User
    const fetchUser = async () => {
        setUser(dummyUserData);
        setSelectedChat(dummyChats[0]);
    };

    // Apply Theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Load chats when user exists
    useEffect(() => {
        if (user) {
            fetchChats();
        } else {
            setChats([]);
            setSelectedChat(null);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        fetchUser();
    }, []);

    const value = {
        navigate,
        user,
        setUser,
        fetchUser,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        theme,
        setTheme
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);