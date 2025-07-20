import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { InterestsModule } from './interests/interests.module';
import { CommandModule } from 'nestjs-command';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { ChatsModule } from './chats/chats.module';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseModule } from './config/supabase/supabase.module';
import { User } from './users/entities/user.entity';
import { Interest } from './interests/entities/interest.entity';
import { Room } from './rooms/entities/room.entity';
import { Chat } from './chats/entities/chat.entity';

// Debug logging
console.log('=== DATABASE CONNECTION DEBUG ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
if (process.env.DATABASE_URL) {
  console.log(
    'DATABASE_URL (first 50 chars):',
    process.env.DATABASE_URL.substring(0, 50) + '...',
  );
}
console.log('SUPABASE_DB_HOST:', process.env.SUPABASE_DB_HOST || 'NOT SET');
console.log('SUPABASE_DB_PORT:', process.env.SUPABASE_DB_PORT || 'NOT SET');
console.log(
  'SUPABASE_DB_USERNAME:',
  process.env.SUPABASE_DB_USERNAME || 'NOT SET',
);
console.log(
  'SUPABASE_DB_PASSWORD:',
  process.env.SUPABASE_DB_PASSWORD ? 'SET' : 'NOT SET',
);
console.log('SUPABASE_DB_NAME:', process.env.SUPABASE_DB_NAME || 'NOT SET');
console.log('=====================================');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.SUPABASE_DB_HOST,
      port: parseInt(process.env.SUPABASE_DB_PORT) || 5432,
      username: process.env.SUPABASE_DB_USERNAME,
      password: process.env.SUPABASE_DB_PASSWORD,
      database: process.env.SUPABASE_DB_NAME,
      entities: [User, Interest, Room, Chat],
      synchronize: process.env.NODE_ENV !== 'production',
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
    SupabaseModule,
    CommandModule,
    UsersModule,
    InterestsModule,
    AuthModule,
    RoomsModule,
    ChatsModule,
  ],
})
export class AppModule {}
