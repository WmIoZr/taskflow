import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Pick<Prisma.UserCreateInput, 'email' | 'username' | 'passwordHash'>,
  ) {
    if (
      (await this.prisma.user.findUnique({ where: { email: data.email } })) !==
      null
    ) {
      throw new ConflictException('This email is already taken');
    }

    return this.prisma.user.create({ data, omit: { passwordHash: true } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
