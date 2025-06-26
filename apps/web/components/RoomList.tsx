'use client';

import type { Room } from '../lib/types';

interface RoomListProps {
  rooms: Room[];
  currentRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}

export function RoomList({ rooms, currentRoomId, onRoomSelect }: RoomListProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Rooms</h2>
      </div>
      <div className="overflow-y-auto">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onRoomSelect(room.id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 transition-colors ${
              currentRoomId === room.id ? 'bg-blue-100 border-blue-200' : ''
            }`}
          >
            <div className="font-medium text-gray-900">{room.name}</div>
            {room.description && (
              <div className="text-sm text-gray-500 mt-1">{room.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
