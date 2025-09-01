// src/components/chat/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios'; // <-- Import axios for API calls
import './Chat.css';

const SOCKET_SERVER_URL = 'http://localhost:3001';
// Define your Laravel API base URL
const LARAVEL_API_BASE_URL = 'http://localhost:8000/api'; // <-- Add API base URL

const Chat = ({ sanctumToken, currentUserId, otherUserId, otherUserName }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]); // State for messages
    const [newMessage, setNewMessage] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(false); // <-- State for loading indicator
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- New useEffect for fetching message history ---
    useEffect(() => {
        const fetchMessageHistory = async () => {
            // Reset messages and input when chatting with a different user or initially
            setMessages([]);
            setNewMessage('');
            setLoadingHistory(true); // Start loading

            // Ensure we have the necessary data to fetch history
            if (!sanctumToken || !currentUserId || !otherUserId) {
                console.error("Chat: Cannot fetch history, missing required props.", { sanctumToken, currentUserId, otherUserId });
                setLoadingHistory(false); // Stop loading even on error
                return;
            }

            try {
                console.log(`Chat: Fetching message history with user ID ${otherUserId}`);
                // Make API call to Laravel to get messages between current user and other user
                const response = await axios.get(`${LARAVEL_API_BASE_URL}/messages/${otherUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${sanctumToken}`, // Include Sanctum token for auth
                    }
                });

                const historyMessages = response.data || [];
                console.log("Chat: Fetched message history:", historyMessages);
                setMessages(historyMessages); // Populate messages state with fetched history
                scrollToBottom(); // Scroll to the bottom to show latest messages
            } catch (error) {
                console.error("Chat: Error fetching message history:", error);
                console.error("Chat: Error response data:", error.response?.data); // Log error details
                console.error("Chat: Error response status:", error.response?.status);
                // TODO: Optionally set an error state to display a message to the user
                // setError("Failed to load chat history.");
                 // Set messages to empty array on error to clear potential stale data
                setMessages([]);
            } finally {
                setLoadingHistory(false); // Stop loading regardless of success or error
            }
        };

        fetchMessageHistory();
    }, [sanctumToken, currentUserId, otherUserId]); // <-- Dependencies: re-run when these change
    // --- End new useEffect ---

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
                // --- Improved logic to prevent duplicates and handle optimistic updates ---
                // Check if the message already exists based on ID or tempId
                const alreadyExists = prevMessages.some(
                    msg => (msg.id && msg.id === message.id) || (msg.tempId && msg.tempId === message.tempId)
                );

                if (alreadyExists) {
                    // If it's an update to an optimistic message (identified by tempId matching a future ID)
                    const existingIndex = prevMessages.findIndex(
                        m => m.tempId && message.id && m.tempId === `temp-${message.id}`
                    );
                    if (existingIndex !== -1) {
                        const updatedMessages = [...prevMessages];
                        updatedMessages[existingIndex] = message; // Replace temp message with confirmed one
                        console.log("Chat: Updated optimistic message with server data");
                        return updatedMessages;
                    }
                    // If it's a true duplicate (e.g., received via socket after loading history),
                    // ignore it.
                    console.log("Chat: Ignoring duplicate message");
                    return prevMessages;
                } else {
                    // Add genuinely new real-time message
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

        // Cleanup function for socket connection
        return () => {
            console.log('Chat: Cleaning up socket connection');
            if (socketInstance) {
                socketInstance.disconnect();
            }
            // Optionally reset socket state here
            // setSocket(null);
        };
    }, [sanctumToken, currentUserId, otherUserId]); // Reconnect if these props change

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
                // sender info might come from props or state if needed immediately
            };

            // Optimistic update: Add temporary message to UI immediately
            setMessages(prevMessages => [...prevMessages, tempMessage]);
            console.log("Chat: Added temporary message to UI");
            scrollToBottom();
            setNewMessage(''); // Clear input field

            // Send message data to the server via Socket.IO
            socket.emit('sendMessage', messageData);
            console.log("Chat: Message emitted to server");
        } else if (!socket) {
             console.warn("Chat: Cannot send message, no socket connection.");
        }
        // Optionally handle case where newMessage is empty
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const displayName = otherUserName || `User ${otherUserId || 'Unknown'}`;

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Chat with {displayName}</h3>
            </div>

            <div className="chat-messages-container">
                {loadingHistory ? ( // <-- Show loading indicator
                    <div className="chat-placeholder">Loading messages...</div>
                ) : messages.length > 0 ? (
                    messages.map((msg) => {
                        // Determine if the message is from the current user
                        // Assumes message object has sender_id and potentially a sender object
                        const isCurrentUser = msg.sender_id == currentUserId || (msg.sender && msg.sender.id == currentUserId);
                        return (
                            <div
                                key={msg.id || msg.tempId} // Use server ID or temp ID for React key
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
                    // Show placeholder if no messages and not loading
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
                    disabled={!socket || loadingHistory} // Disable input while loading history
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !socket || loadingHistory} // Disable button while loading
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;