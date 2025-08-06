import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AiConfig } from './src/ai/entities/ai-config.entity';
import { Message } from './src/messages/entities/message.entity';
import { Invitation } from './src/rooms/entities/invitation.entity';
import { Room } from './src/rooms/entities/room.entity';
import { User } from './src/users/entities/user.entity';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT) || 5432,
  username: process.env.SUPABASE_DB_USERNAME,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  entities: [User, Room, Message, AiConfig, Invitation],
  migrations: ['src/migrations/*.ts'],
  ssl: {
    rejectUnauthorized: false,
  },
});
