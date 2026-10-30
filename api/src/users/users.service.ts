import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class UsersService {
  create(
    data: Pick<Prisma.UserCreateInput, 'email' | 'username' | 'passwordHash'>,
  ) {
    return 'This action adds a new user';
  }

  findByEmail(email: string) {
    return `This action returns a #${email} user`;
  }
}
