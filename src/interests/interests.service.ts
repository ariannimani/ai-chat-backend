import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interest } from './entities/interest.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private interestRepository: Repository<Interest>,
  ) {}

  async getAll() {
    return await this.interestRepository.find();
  }

  async bulkInsert(interests: string[]) {
    const interestsToInsert = interests.map((interest) => ({ name: interest }));
    const insertedInterests =
      await this.interestRepository.save(interestsToInsert);

    return {
      message: 'Interests created successfully',
      data: insertedInterests,
    };
  }

  async removeAll() {
    const result = await this.interestRepository
      .createQueryBuilder()
      .delete()
      .from(Interest)
      .execute();

    return {
      message: 'Interests removed successfully',
      data: { affected: result.affected },
    };
  }
}
