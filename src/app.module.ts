import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandModule } from 'nestjs-command';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ChatsModule } from './chats/chats.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

import { Chat } from './chats/entities/chat.entity';
import { SupabaseAuthGuard } from './config/guard/supabase-auth.guard';
import { SupabaseModule } from './config/supabase/supabase.module';
import { Room } from './rooms/entities/room.entity';
import { User } from './users/entities/user.entity';

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
      entities: [User, Room, Chat],
      // Development: auto-sync for quick iteration
      synchronize: process.env.NODE_ENV === 'development',
      // Production: use migrations for controlled schema changes
      migrations: ['dist/migrations/*.js'],
      migrationsRun: process.env.NODE_ENV === 'production',
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    SupabaseModule,
    CommandModule,
    AiModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    ChatsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
