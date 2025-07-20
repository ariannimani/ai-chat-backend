import { Module } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { InterestCommand } from './interests.command';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interest } from './entities/interest.entity';
import { InterestsController } from './interests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Interest])],
  providers: [InterestCommand, InterestsService],
  controllers: [InterestsController],
})
export class InterestsModule {}
