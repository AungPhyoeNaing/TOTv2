// src/components/chat/Chat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Remove io import since we're using the passed socket
// import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';

// Remove the constant SOCKET_SERVER_URL
// const SOCKET_SERVER_URL = 'http://localhost:3001';
const LARAVEL_API_BASE_URL = 'http://localhost:8000/api';

// Accept the onViewProfile, onlineUsers, isOtherUserOnline, and socket props
const Chat = ({ sanctumToken, currentUserId, otherUserId, otherUserName, onViewProfile, onlineUsers, isOtherUserOnline, socket }) => { // <-- Accept socket prop
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

    // Fetch message history
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

    // Join chat room and set up listeners using the passed socket
    useEffect(() => {
        if (!socket || !currentUserId || !otherUserId) {
            console.warn("Chat: Missing socket or user IDs, cannot setup chat listeners.");
            return;
        }

        console.log(`Chat: Setting up listeners and joining chat room with user ID ${otherUserId} using main socket.`);

        // Join the specific chat room for this conversation
        socket.emit('joinChat', { otherUserId });

        // Listener for receiving messages
        const handleReceiveMessage = (message) => {
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
        };

        // Listener for message errors
        const handleMessageError = (data) => {
            console.error("Chat: Error from server:", data.error);
            alert(`Chat Error: ${data.error}`);
        };

        // Attach listeners
        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('messageError', handleMessageError);

        // Cleanup: Remove listeners when component unmounts or dependencies change
        return () => {
            console.log('Chat: Cleaning up listeners');
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('messageError', handleMessageError);
            // Note: We don't leave the room here as the socket might be used elsewhere,
            // and the server handles disconnection cleanup automatically.
        };
    }, [socket, currentUserId, otherUserId]); // Re-run if socket, currentUserId, or otherUserId changes


    const handleSendMessage = useCallback(() => { // Use useCallback for consistency
        if (newMessage.trim() && socket) { // Use the passed socket
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

            socket.emit('sendMessage', messageData); // Use the passed socket
            console.log("Chat: Message emitted to server via main socket");
        } else if (!socket) {
             console.warn("Chat: Cannot send message, no socket connection available.");
        }
    }, [newMessage, socket, currentUserId, otherUserId]);

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
                        style={{ cursor: 'pointer', marginLeft: '5px', color: '#646cff' }} // Use theme color
                        // Consider using a dedicated CSS class for better styling
                    >
                        {displayName}
                    </span>
                    {/* --- DISPLAY ONLINE STATUS --- */}
                    <span className={`online-status-chat ${isOtherUserOnline ? 'online' : 'offline'}`}>
                        <span className="status-indicator-chat"></span>
                        <span className="status-text-chat">{isOtherUserOnline ? 'Online' : 'Offline'}</span>
                    </span>
                    {/* --- END DISPLAY --- */}
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
                    disabled={!socket || loadingHistory} // Disable if no socket
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !socket || loadingHistory} // Disable if no socket or empty message
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;