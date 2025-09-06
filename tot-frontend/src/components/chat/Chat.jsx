// src/components/chat/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';

const SOCKET_SERVER_URL = 'http://localhost:3001';
const LARAVEL_API_BASE_URL = 'http://localhost:8000/api';

// Accept the onViewProfile prop
const Chat = ({ sanctumToken, currentUserId, otherUserId, otherUserName, onViewProfile }) => { // <-- Accept onViewProfile
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchMessageHistory = async () => {
            setMessages([]);
            setNewMessage('');
            setLoadingHistory(true);

            if (!sanctumToken || !currentUserId || !otherUserId) {
                console.error("Chat: Cannot fetch history, missing required props.", { sanctumToken, currentUserId, otherUserId });
                setLoadingHistory(false);
                return;
            }

            try {
                console.log(`Chat: Fetching message history with user ID ${otherUserId}`);
                const response = await axios.get(`${LARAVEL_API_BASE_URL}/messages/${otherUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${sanctumToken}`,
                    }
                });

                const historyMessages = response.data || [];
                console.log("Chat: Fetched message history:", historyMessages);
                setMessages(historyMessages);
                scrollToBottom();
            } catch (error) {
                console.error("Chat: Error fetching message history:", error);
                console.error("Chat: Error response data:", error.response?.data);
                console.error("Chat: Error response status:", error.response?.status);
                setMessages([]);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchMessageHistory();
    }, [sanctumToken, currentUserId, otherUserId]);

    useEffect(() => {

        if (!sanctumToken || !currentUserId || !otherUserId) {
            console.error("Chat: Missing required props for socket connection (sanctumToken, currentUserId, otherUserId)");
            return;
        }

        console.log(`Chat: Initializing socket connection with user ID ${otherUserId}`);

        const socketInstance = io(SOCKET_SERVER_URL, {
            auth: { token: sanctumToken },
            withCredentials: true
        });

        socketInstance.on('connect', () => {
            console.log('Chat: Connected to server with socket ID:', socketInstance.id);
            setSocket(socketInstance);
            socketInstance.emit('joinChat', { otherUserId });
        });

        socketInstance.on('receiveMessage', (message) => {
            console.log("Chat: Received message (real-time or confirmation):", message);
            setMessages(prevMessages => {
                const alreadyExists = prevMessages.some(
                    msg => (msg.id && msg.id === message.id) || (msg.tempId && msg.tempId === message.tempId)
                );

                if (alreadyExists) {
                    const existingIndex = prevMessages.findIndex(
                        m => m.tempId && message.id && m.tempId === `temp-${message.id}`
                    );
                    if (existingIndex !== -1) {
                        const updatedMessages = [...prevMessages];
                        updatedMessages[existingIndex] = message;
                        console.log("Chat: Updated optimistic message with server data");
                        return updatedMessages;
                    }
                    console.log("Chat: Ignoring duplicate message");
                    return prevMessages;
                } else {
                    console.log("Chat: Added new real-time message");
                    return [...prevMessages, message];
                }
            });
            scrollToBottom();
        });

        socketInstance.on('messageError', (data) => {
            console.error("Chat: Error from server:", data.error);
            alert(`Chat Error: ${data.error}`);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('Chat: Disconnected from server. Reason:', reason);
        });

        return () => {
            console.log('Chat: Cleaning up socket connection');
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [sanctumToken, currentUserId, otherUserId]);

    const handleSendMessage = () => {
        if (newMessage.trim() && socket) {
            const messageContent = newMessage.trim();
            const messageData = {
                sender_id: currentUserId,
                recipient_id: otherUserId,
                content: messageContent,
            };

            console.log("Chat: Sending message optimistically");
            const tempMessage = {
                ...messageData,
                id: undefined,
                tempId: `temp-${Date.now()}`,
                created_at: new Date().toISOString(),
            };

            setMessages(prevMessages => [...prevMessages, tempMessage]);
            console.log("Chat: Added temporary message to UI");
            scrollToBottom();
            setNewMessage('');

            socket.emit('sendMessage', messageData);
            console.log("Chat: Message emitted to server");
        } else if (!socket) {
             console.warn("Chat: Cannot send message, no socket connection.");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Use the provided name or fallback
    const displayName = otherUserName || `User ${otherUserId || 'Unknown'}`;

    return (
        <div className="chat-container">
            <div className="chat-header">
                {/* Make the user's name clickable */}
                <h3>
                    Chat with
                    <span
                        onClick={() => {
                            // Check if onViewProfile function exists and otherUserId is available
                            if (onViewProfile && otherUserId) {
                                onViewProfile(otherUserId); // Call onViewProfile with the other user's ID
                            }
                        }}
                        style={{ cursor: 'pointer', marginLeft: '5px', color: 'blue' }} // Basic styling
                        // Consider using a dedicated CSS class for better styling
                    >
                        {displayName}
                    </span>
                </h3>
            </div>

            <div className="chat-messages-container">
                {loadingHistory ? (
                    <div className="chat-placeholder">Loading messages...</div>
                ) : messages.length > 0 ? (
                    messages.map((msg) => {
                        const isCurrentUser = msg.sender_id == currentUserId || (msg.sender && msg.sender.id == currentUserId);
                        return (
                            <div
                                key={msg.id || msg.tempId}
                                className={`message-bubble ${isCurrentUser ? 'message-outgoing' : 'message-incoming'}`}
                            >
                                <div>{msg.content}</div>
                                <span className="message-timestamp">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="chat-placeholder">
                        Start the conversation with {displayName}...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${displayName}...`}
                    disabled={!socket || loadingHistory}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !socket || loadingHistory}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;