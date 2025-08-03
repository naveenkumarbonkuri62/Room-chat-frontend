import React, { useEffect, useRef, useState } from "react";
import { Paperclip, Send, LogOut, User, MessageCircle, Users, Wifi, Clock, Sun, Moon } from "lucide-react";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { baseURL } from "../config/AxiosHelper";
import { getMessagess } from "../services/RoomService";
import { timeAgo } from "../config/helper";

const ChatPage = () => {
  const {
    roomId,
    currentUser,
    connected,
    setConnected,
    setRoomId,
    setCurrentUser,
  } = useChatContext();

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const chatBoxRef = useRef(null);
  const [stompClient, setStompClient] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Profile picture generation
  const [userProfiles, setUserProfiles] = useState({});

  const generateUserProfile = (username) => {
    if (userProfiles[username]) {
      return userProfiles[username];
    }

    // Generate consistent colors based on username - more muted colors for light mode
    const colors = [
      'from-rose-400 to-pink-400',
      'from-purple-400 to-violet-400',
      'from-blue-400 to-sky-400',
      'from-emerald-400 to-teal-400',
      'from-amber-400 to-orange-400',
      'from-red-400 to-rose-400',
      'from-indigo-400 to-purple-400',
      'from-cyan-400 to-blue-400',
      'from-orange-400 to-red-400',
      'from-green-400 to-emerald-400'
    ];

    // Simple hash function for consistent color selection
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = ((hash << 5) - hash + username.charCodeAt(i)) & 0xffffffff;
    }
    const colorIndex = Math.abs(hash) % colors.length;

    // Generate initials
    const initials = username
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);

    const profile = {
      gradient: colors[colorIndex],
      initials: initials || username.charAt(0).toUpperCase(),
      username
    };

    setUserProfiles(prev => ({ ...prev, [username]: profile }));
    return profile;
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

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

  useEffect(() => {
    if (!connected) {
      navigate("/");
    }
  }, [connected]);

  useEffect(() => {
    async function loadMessages() {
      try {
        const messages = await getMessagess(roomId);
        setMessages(messages);
      } catch (error) {
        console.error("Failed to load messages", error);
        toast.error("Failed to load messages");
      }
    }

    if (connected) {
      loadMessages();
    }
  }, [connected, roomId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scroll({
        top: chatBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const connectWebSocket = () => {
      const sock = new SockJS(`${baseURL}/chat`);
      const client = Stomp.over(sock);

      client.connect({}, () => {
        setStompClient(client);
        setIsOnline(true);
        toast.success("Connected to chat", {
          duration: 2000,
          style: {
            background: '#10b981',
            color: 'white',
          },
        });

        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
          setTyping(false);
        });

        client.subscribe(`/topic/typing/${roomId}`, (msg) => {
          if (msg.body !== currentUser) {
            setTyping(true);
            setTimeout(() => setTyping(false), 1500);
          }
        });
      }, (error) => {
        setIsOnline(false);
        toast.error("Connection failed", {
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });
      });
    };

    if (connected) {
      connectWebSocket();
    }
  }, [connected, roomId]);

  const sendMessage = () => {
    if (stompClient && connected && input.trim() && !sending) {
      setSending(true);
      const message = {
        sender: currentUser,
        content: input,
        roomId: roomId,
      };

      stompClient.send(
        `/app/sendMessage/${roomId}`,
        {},
        JSON.stringify(message)
      );
      setInput("");
      
      setTimeout(() => setSending(false), 500);
    }
  };

  const handleTyping = () => {
    if (stompClient && connected) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      stompClient.send(`/app/typing/${roomId}`, {}, currentUser);
      
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    }
  };

  const handleLogout = () => {
    if (stompClient) stompClient.disconnect();
    setConnected(false);
    setRoomId("");
    setCurrentUser("");
    navigate("/");
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100'
    }`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-sm transition-all duration-500 ${
        isDarkMode
          ? 'bg-gray-800/80 border-gray-700/50'
          : 'bg-white/80 border-gray-200/60'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              {/* Room Info */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400/30'
                  : 'bg-gradient-to-r from-slate-100 to-gray-100 border-gray-200'
              }`}>
                <div className="relative">
                  <MessageCircle className={`${
                    isDarkMode ? 'text-indigo-400' : 'text-slate-600'
                  }`} size={18} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>Room</span>
                  <span className={`text-sm font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>{roomId}</span>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  isOnline 
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600/30' 
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600/30'
                }`}>
                  <Wifi size={12} />
                  <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                  isDarkMode
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {isDarkMode ? (
                  <Sun className="text-yellow-400" size={16} />
                ) : (
                  <Moon className="text-gray-600" size={16} />
                )}
              </button>

              {/* User Info */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/30'
                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
              }`}>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center ring-2 ring-white/20">
                  <span className="text-white font-bold text-xs">
                    {generateUserProfile(currentUser).initials}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>You</span>
                  <span className={`text-sm font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>{currentUser}</span>
                </div>
              </div>
              
              {/* Leave Button */}
              <button
                onClick={handleLogout}
                className={`group flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border-red-400/30 hover:border-red-400/50'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-200 hover:border-red-300'
                }`}
              >
                <LogOut className="text-red-600 group-hover:text-red-700 dark:text-red-400 dark:group-hover:text-red-300" size={16} />
                <span className="text-red-600 group-hover:text-red-700 dark:text-red-400 dark:group-hover:text-red-300 font-medium text-sm">
                  Leave
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main
        ref={chatBoxRef}
        className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto h-screen overflow-y-auto custom-scrollbar"
      >
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.sender === currentUser ? "justify-end" : "justify-start"
              } animate-fade-in`}
            >
              {/* Avatar for other users */}
              {message.sender !== currentUser && (
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br ${
                    generateUserProfile(message.sender).gradient
                  } ring-2 ring-white/20`}>
                    <span className="text-white font-bold text-xs">
                      {generateUserProfile(message.sender).initials}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Container */}
              <div className={`group relative max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
                message.sender === currentUser ? 'order-1' : 'order-2'
              }`}>
                {/* Sender Name for other users */}
                {message.sender !== currentUser && (
                  <div className="flex items-center space-x-2 mb-1 ml-1">
                    <span className={`text-xs font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {message.sender}
                    </span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ease-in-out hover:shadow-md ${
                    message.sender === currentUser
                      ? isDarkMode
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white ml-auto"
                        : "bg-gradient-to-br from-slate-600 to-gray-700 text-white ml-auto"
                      : isDarkMode
                        ? "bg-gray-700/80 text-gray-100 border border-gray-600/50"
                        : "bg-white text-gray-700 border border-gray-200"
                  } ${message.sender === currentUser ? 'rounded-br-md' : 'rounded-bl-md'}`}
                >
                  {/* Message Content */}
                  <div className="leading-relaxed break-words whitespace-pre-wrap text-sm sm:text-base">
                    {message.content}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center space-x-1 mt-2">
                    <Clock size={10} className={
                      message.sender === currentUser 
                        ? isDarkMode ? "text-indigo-200" : "text-slate-300"
                        : isDarkMode ? "text-gray-400" : "text-gray-400"
                    } />
                    <span className={`text-xs ${
                      message.sender === currentUser 
                        ? isDarkMode ? "text-indigo-200" : "text-slate-300"
                        : isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {timeAgo(message.timeStamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar for current user */}
              {message.sender === currentUser && (
                <div className="flex-shrink-0 mt-1 order-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/20 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      : 'bg-gradient-to-br from-slate-600 to-gray-700'
                  }`}>
                    <span className="text-white font-bold text-xs">
                      {generateUserProfile(currentUser).initials}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex items-start space-x-3 animate-fade-in">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white/20">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className={`rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gray-700/80 border-gray-600/50'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center space-x-1">
                  <span className={`text-xs font-medium mr-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>typing</span>
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? 'bg-gray-400' : 'bg-gray-400'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? 'bg-gray-400' : 'bg-gray-400'
                    }`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isDarkMode ? 'bg-gray-400' : 'bg-gray-400'
                    }`} style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t transition-all duration-500 ${
        isDarkMode
          ? 'bg-gray-800/80 border-gray-700/50'
          : 'bg-white/80 border-gray-200/60'
      }`}>
        <div className="max-w-5xl mx-auto p-4">
          <div className={`flex items-center space-x-3 backdrop-blur-sm border rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 ${
            isDarkMode
              ? 'bg-gray-700/60 border-gray-600/50 hover:bg-gray-700/80'
              : 'bg-gray-50/70 border-gray-200 hover:bg-gray-50/90'
          }`}>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              type="text"
              placeholder="Type your message..."
              className={`flex-1 bg-transparent focus:outline-none text-sm sm:text-base font-medium transition-colors duration-300 ${
                isDarkMode
                  ? 'text-gray-100 placeholder-gray-400'
                  : 'text-gray-700 placeholder-gray-400'
              }`}
              disabled={!isOnline}
            />
            
            <div className="flex items-center space-x-2">
              <button 
                className={`group p-2.5 rounded-xl border transition-all duration-200 ease-in-out transform hover:scale-110 ${
                  isDarkMode
                    ? 'bg-gray-600 hover:bg-gray-500 border-gray-500/50'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                }`}
                disabled={!isOnline}
              >
                <Paperclip className={`transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-300 group-hover:text-gray-200'
                    : 'text-gray-600 group-hover:text-gray-700'
                }`} size={18} />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending || !isOnline}
                className={`group p-2.5 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                    : 'bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800'
                }`}
              >
                <Send className={`text-white ${sending ? 'animate-pulse' : ''}`} size={18} />
              </button>
            </div>
          </div>
          
          {!isOnline && (
            <div className="flex items-center justify-center mt-2">
              <div className={`flex items-center space-x-2 text-xs px-3 py-1 rounded-full border ${
                isDarkMode
                  ? 'text-red-400 bg-red-900/30 border-red-600/30'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Reconnecting...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(148, 163, 184, 0.1)'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(148, 163, 184, 0.3)'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(148, 163, 184, 0.5)'};
        }
      `}</style>
    </div>
  );
};

export default ChatPage;