"use client";

import { useState, useEffect } from "react";
import { MessageList, MessageInput } from "../components/Chat";
import { RoomList } from "../components/RoomList";
import { useChat } from "../hooks/useSocket";
import { fetchRooms, fetchMessages } from "../lib/api";
import type { User, Room } from "../lib/types";
import { LoginForm } from "../components/login-form";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const { messages, sendMessage, isConnected, error } = useChat(
    currentRoomId,
    user
  );

  // Load rooms when user logs in
  useEffect(() => {
    if (!user) return;

    const loadRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const roomsData = await fetchRooms();
        setRooms(roomsData);
        if (roomsData.length > 0 && !currentRoomId) {
          setCurrentRoomId(roomsData[0].id);
        }
      } catch (error) {
        console.error("Error loading rooms:", error);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, [user, currentRoomId]);

  // Load existing messages when room changes
  useEffect(() => {
    if (!currentRoomId) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        await fetchMessages(currentRoomId);
        // Note: In a real app, you'd want to merge these with real-time messages
        // For now, we'll rely on the real-time messages from the socket
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentRoomId]);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoginForm
          className="max-w-xs w-full"
          onLogin={(user) => setUser(user)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <RoomList
        rooms={rooms}
        currentRoomId={currentRoomId}
        onRoomSelect={setCurrentRoomId}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {rooms.find((r) => r.id === currentRoomId)?.name || "Chat"}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user.username}!
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </div>

        {/* Messages */}
        {currentRoomId ? (
          <>
            {isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : (
              <MessageList messages={messages} />
            )}

            <MessageInput onSendMessage={sendMessage} disabled={!isConnected} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {isLoadingRooms ? (
              <div className="text-gray-500">Loading rooms...</div>
            ) : (
              <div className="text-gray-500">
                Select a room to start chatting
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
