import { DatabaseService } from './database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const db = new DatabaseService();

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Check if rooms already exist
    const existingRooms = await db.getRooms();
    if (existingRooms.length > 0) {
      console.log('✅ Rooms already exist, skipping seed');
      return;
    }

    // Create default rooms
    const rooms = [
      { name: 'General', description: 'General discussion for everyone' },
      { name: 'Random', description: 'Random thoughts and fun conversations' },
      { name: 'Tech Talk', description: 'Discuss technology, programming, and development' },
      { name: 'Gaming', description: 'Chat about games and gaming culture' },
    ];

    for (const roomData of rooms) {
      const room = await db.createRoom(roomData.name, roomData.description);
      console.log(`✅ Created room: ${room.name}`);
    }

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
