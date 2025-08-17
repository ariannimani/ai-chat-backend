import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandModule } from 'nestjs-command';
import { AiModule } from './ai/ai.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

import { AiConfig } from './ai/entities/ai-config.entity';
import { AiAttachment } from './attachments/entities/ai-attachment.entity';
import { RoomAttachment } from './attachments/entities/room-attachment.entity';
import { HttpExceptionFilter } from './common/errors/http-exception.filter';
import { SupabaseAuthGuard } from './config/guard/supabase-auth.guard';
import { SupabaseModule } from './config/supabase/supabase.module';
import { Message } from './messages/entities/message.entity';
import { Invitation } from './rooms/entities/invitation.entity';
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
      entities: [
        User,
        Room,
        Message,
        Invitation,
        AiConfig,
        AiAttachment,
        RoomAttachment,
      ],
      // Development: use migrations for controlled schema changes
      synchronize: true,
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
    AttachmentsModule,
    UsersModule,
    AuthModule,
    RoomsModule,
    MessagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
