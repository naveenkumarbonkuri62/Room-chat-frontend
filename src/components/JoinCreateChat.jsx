import React, { useState, useEffect } from "react";
import { MessageCircle, Users, Plus, LogIn, User, Hash, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import { createRoomApi, joinChatApi } from "../services/RoomService";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";

const JoinCreateChat = () => {
  const [detail, setDetail] = useState({
    roomId: "",
    userName: "",
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if there's a saved theme preference, otherwise check system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { roomId, userName, setRoomId, setCurrentUser, setConnected } =
    useChatContext();
  const navigate = useNavigate();

  // Apply theme to document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  function handleFormInputChange(event) {
    setDetail({
      ...detail,
      [event.target.name]: event.target.value,
    });
  }

  function validateForm() {
    if (detail.roomId === "" || detail.userName === "") {
      toast.error("Invalid Input !!", {
        style: {
          background: isDarkMode ? '#ef4444' : '#ef4444',
          color: 'white',
        },
      });
      return false;
    }
    return true;
  }

  async function joinChat() {
    if (validateForm()) {
      //join chat

      try {
        const room = await joinChatApi(detail.roomId);
        toast.success("joined..", {
          style: {
            background: isDarkMode ? '#10b981' : '#10b981',
            color: 'white',
          },
        });
        setCurrentUser(detail.userName);
        setRoomId(room.roomId);
        setConnected(true);
        navigate("/chat");
      } catch (error) {
        if (error.status == 400) {
          toast.error(error.response.data, {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });
        } else {
          toast.error("Error in joining room", {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });
        }
        console.log(error);
      }
    }
  }

  async function createRoom() {
    if (validateForm()) {
      //create room
      console.log(detail);
      // call api to create room on backend
      try {
        const response = await createRoomApi(detail.roomId);
        console.log(response);
        toast.success("Room Created Successfully !!", {
          style: {
            background: '#10b981',
            color: 'white',
          },
        });
        //join the room
        setCurrentUser(detail.userName);
        setRoomId(response.roomId);
        setConnected(true);

        navigate("/chat");

        //forward to chat page...
      } catch (error) {
        console.log(error);
        if (error.status == 400) {
          toast.error("Room  already exists !!", {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });
        } else {
          toast.error("Error in creating room", {
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });
        }
      }
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    } flex items-center justify-center p-4`}>
      
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg ${
          isDarkMode
            ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30'
            : 'bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30'
        } backdrop-blur-sm`}
      >
        {isDarkMode ? (
          <Sun className="text-yellow-400" size={20} />
        ) : (
          <Moon className="text-indigo-600" size={20} />
        )}
      </button>

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-500 ${
          isDarkMode ? 'bg-indigo-500/10' : 'bg-blue-400/20'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-500 ${
          isDarkMode ? 'bg-purple-500/10' : 'bg-indigo-400/20'
        }`}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className={`backdrop-blur-xl border rounded-3xl shadow-2xl p-8 animate-fade-in transition-all duration-500 ${
          isDarkMode
            ? 'bg-gray-800/80 border-gray-700/50'
            : 'bg-white/80 border-slate-200/50'
        }`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <MessageCircle className="text-white" size={32} />
              </div>
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              }`}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h1 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              Join the Conversation
            </h1>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-slate-600'
            }`}>
              Connect with others in real-time chat rooms
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="userName" className={`block text-sm font-semibold ml-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-slate-700'
              }`}>
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-slate-400'
                  }`} size={18} />
                </div>
                <input
                  onChange={handleFormInputChange}
                  value={detail.userName}
                  type="text"
                  id="userName"
                  name="userName"
                  placeholder="Enter your name"
                  className={`w-full pl-12 pr-4 py-3.5 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700/60 border-gray-600/50 text-white placeholder-gray-400 focus:ring-indigo-500/50 focus:border-indigo-400 hover:bg-gray-700/80'
                      : 'bg-white/60 border-slate-200/50 text-slate-800 placeholder-slate-500 focus:ring-blue-500/50 focus:border-blue-300 hover:bg-white/80'
                  }`}
                />
              </div>
            </div>

            {/* Room ID Input */}
            <div className="space-y-2">
              <label htmlFor="roomId" className={`block text-sm font-semibold ml-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-slate-700'
              }`}>
                Room ID / New Room ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-slate-400'
                  }`} size={18} />
                </div>
                <input
                  name="roomId"
                  onChange={handleFormInputChange}
                  value={detail.roomId}
                  type="text"
                  id="roomId"
                  placeholder="Enter the room id"
                  className={`w-full pl-12 pr-4 py-3.5 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700/60 border-gray-600/50 text-white placeholder-gray-400 focus:ring-indigo-500/50 focus:border-indigo-400 hover:bg-gray-700/80'
                      : 'bg-white/60 border-slate-200/50 text-slate-800 placeholder-slate-500 focus:ring-blue-500/50 focus:border-blue-300 hover:bg-white/80'
                  }`}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={joinChat}
                className={`group flex-1 flex items-center justify-center space-x-2 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg shadow-md ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                }`}
              >
                <LogIn className="group-hover:translate-x-0.5 transition-transform duration-200" size={18} />
                <span>Join Room</span>
              </button>
              
              <button
                onClick={createRoom}
                className="group flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg shadow-md"
              >
                <Plus className="group-hover:rotate-90 transition-transform duration-200" size={18} />
                <span>Create Room</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700/50' : 'border-slate-200/50'
          }`}>
            <div className={`flex items-center justify-center space-x-2 text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-slate-500'
            }`}>
              <Users size={14} />
              <span>Connect with people around the world</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className={`backdrop-blur-sm border rounded-xl p-4 text-center transition-all duration-200 ${
            isDarkMode
              ? 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-800/80'
              : 'bg-white/60 border-slate-200/50 hover:bg-white/80'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${
              isDarkMode
                ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
                : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20'
            }`}>
              <MessageCircle className={`${
                isDarkMode ? 'text-indigo-400' : 'text-blue-600'
              }`} size={16} />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-200' : 'text-slate-700'
            }`}>Real-time Chat</span>
          </div>
          
          <div className={`backdrop-blur-sm border rounded-xl p-4 text-center transition-all duration-200 ${
            isDarkMode
              ? 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-800/80'
              : 'bg-white/60 border-slate-200/50 hover:bg-white/80'
          }`}>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="text-emerald-600" size={16} />
            </div>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-200' : 'text-slate-700'
            }`}>Group Rooms</span>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default JoinCreateChat;