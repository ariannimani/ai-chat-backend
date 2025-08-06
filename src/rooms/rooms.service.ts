import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
  ) {}

  async create(
    userId: string,
    createRoomDto: CreateRoomDto,
    userInfo?: { email: string; name: string },
  ) {
    let user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user && userInfo) {
      this.logger.log(`🆕 Auto-creating user: ${userInfo.email}`);

      // Auto-create user in local database
      user = this.userRepository.create({
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        username: userInfo.email, // Use email as username for auto-created users
        password: 'supabase-auth', // Placeholder since we use Supabase for auth
        password_key: 'supabase-auth', // Placeholder since we use Supabase for auth
      });

      user = await this.userRepository.save(user);
    } else if (!user) {
      this.logger.error(`❌ User not found with ID: ${userId}`);
      throw new Error(
        `User not found with ID: ${userId}. Please ensure user is properly registered in the system.`,
      );
    }

    // Combine provided member IDs with current user ID
    const memberIds = [...(createRoomDto.members || []), user.id].filter(
      Boolean,
    );
    const members = await this.userRepository.findByIds(memberIds);

    // Check if any members were not found
    const foundMemberIds = members.map((m) => m.id);
    const missingMemberIds = memberIds.filter(
      (id) => !foundMemberIds.includes(id),
    );
    if (missingMemberIds.length > 0) {
      this.logger.warn(`⚠️ Some members not found:`, missingMemberIds);
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      members: [...members, user], // Ensure current user is included
      ai_instructions: createRoomDto.aiInstructions,
    });

    const savedRoom = await this.roomRepository.save(room);
    this.logger.log(
      `✅ Room "${savedRoom.name}" created with ${savedRoom.members.length} members`,
    );

    return savedRoom;
  }

  async getByRequest(userId: string) {
    const rooms = await this.roomRepository.find({
      where: {
        members: {
          id: userId,
        },
      },
      relations: ['members', 'messages'],
      order: {
        createdAt: 'DESC',
      },
    });

    this.logger.log(`📋 Found ${rooms.length} rooms for user`);
    return rooms;
  }

  // Invitation methods

  async createInvitation(
    roomId: string,
    userId: string,
    createInvitationDto: CreateInvitationDto,
  ) {
    // Check if room exists and user is a member
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['members'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isMember = room.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new BadRequestException('Only room members can create invitations');
    }

    // Find the inviting user
    const invitingUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!invitingUser) {
      throw new NotFoundException('User not found');
    }

    let invitedUser = null;
    let invitedEmail = createInvitationDto.email;

    // If userId is provided, find the user and get their email
    if (createInvitationDto.userId) {
      invitedUser = await this.userRepository.findOne({
        where: { id: createInvitationDto.userId },
      });

      if (!invitedUser) {
        throw new NotFoundException('Invited user not found');
      }

      invitedEmail = invitedUser.email;

      // Check if user is already a member
      const isAlreadyMember = room.members.some(
        (member) => member.id === invitedUser.id,
      );
      if (isAlreadyMember) {
        throw new BadRequestException('User is already a member of this room');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        room: { id: roomId },
        status: InvitationStatus.PENDING,
        ...(invitedUser
          ? { invitedUser: { id: invitedUser.id } }
          : { invitedEmail }),
      },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'A pending invitation already exists for this user',
      );
    }

    // Generate unique invitation code
    const code = this.generateInvitationCode();

    // Set expiration time
    const expirationHours = createInvitationDto.expirationHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Create invitation
    const invitation = this.invitationRepository.create({
      code,
      room,
      invitedBy: invitingUser,
      invitedUser,
      invitedEmail,
      expiresAt,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    this.logger.log(
      `💌 Invitation created for room "${room.name}" by ${invitingUser.email}`,
    );

    return savedInvitation;
  }

  async joinRoom(userId: string, joinRoomDto: JoinRoomDto) {
    // Find the invitation
    const invitation = await this.invitationRepository.findOne({
      where: {
        code: joinRoomDto.invitationCode,
        status: InvitationStatus.PENDING,
      },
      relations: ['room', 'room.members'],
    });

    if (!invitation) {
      throw new NotFoundException(
        'Invalid invitation code or invitation no longer available',
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Find the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if invitation is for this user (if specific user was invited)
    if (invitation.invitedUser && invitation.invitedUser.id !== userId) {
      throw new BadRequestException('This invitation is not intended for you');
    }

    // Check if invitation is for this user's email (if invited by email)
    if (invitation.invitedEmail && invitation.invitedEmail !== user.email) {
      throw new BadRequestException(
        'This invitation is not intended for your email address',
      );
    }

    // Check if user is already a member
    const isAlreadyMember = invitation.room.members.some(
      (member) => member.id === userId,
    );
    if (isAlreadyMember) {
      throw new BadRequestException('You are already a member of this room');
    }

    // Add user to room
    invitation.room.members.push(user);
    await this.roomRepository.save(invitation.room);

    // Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    this.logger.log(
      `✅ User ${user.email} joined room "${invitation.room.name}" via invitation`,
    );

    return {
      message: 'Successfully joined room',
      room: invitation.room,
    };
  }

  async getUserInvitations(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get invitations for this user (by user ID or email)
    const invitations = await this.invitationRepository.find({
      where: [
        {
          invitedUser: { id: userId },
          status: InvitationStatus.PENDING,
        },
        {
          invitedEmail: user.email,
          status: InvitationStatus.PENDING,
        },
      ],
      relations: ['room', 'invitedBy'],
    });

    // Filter out expired invitations and mark them as expired
    const validInvitations = [];
    const now = new Date();

    for (const invitation of invitations) {
      if (invitation.expiresAt && now > invitation.expiresAt) {
        invitation.status = InvitationStatus.EXPIRED;
        await this.invitationRepository.save(invitation);
      } else {
        validInvitations.push(invitation);
      }
    }

    this.logger.log(
      `📬 Found ${validInvitations.length} pending invitations for user`,
    );

    return validInvitations;
  }

  async updateInvitation(
    invitationId: string,
    userId: string,
    updateInvitationDto: UpdateInvitationDto,
  ) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['room', 'room.members', 'invitedUser'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is for this user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isInvitedUser =
      (invitation.invitedUser && invitation.invitedUser.id === userId) ||
      invitation.invitedEmail === user.email;

    if (!isInvitedUser) {
      throw new BadRequestException(
        'You can only respond to your own invitations',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'This invitation has already been responded to',
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Update invitation status
    invitation.status = updateInvitationDto.status;

    // If accepted, add user to room
    if (updateInvitationDto.status === InvitationStatus.ACCEPTED) {
      // Check if user is already a member
      const isAlreadyMember = invitation.room.members.some(
        (member) => member.id === userId,
      );

      if (!isAlreadyMember) {
        invitation.room.members.push(user);
        await this.roomRepository.save(invitation.room);
      }

      this.logger.log(
        `✅ User ${user.email} accepted invitation to join room "${invitation.room.name}"`,
      );
    } else {
      this.logger.log(
        `❌ User ${user.email} declined invitation to join room "${invitation.room.name}"`,
      );
    }

    await this.invitationRepository.save(invitation);

    return {
      message: `Invitation ${updateInvitationDto.status}`,
      invitation,
    };
  }

  private generateInvitationCode(): string {
    return randomBytes(16).toString('hex');
  }
}
