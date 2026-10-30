import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: number, createCommentDto: CreateCommentDto) {
    await this.checkTaskExists(taskId);
    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        taskId,
      },
      include: withAuthor,
    });
  }

  async findAll(taskId: number) {
    await this.checkTaskExists(taskId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: withAuthor,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const foundComment = await this.prisma.comment.findUnique({
      where: { id },
      include: withAuthor,
    });
    if (foundComment === null) {
      throw new NotFoundException(`Comment #${id} not found`);
    }
    return foundComment;
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: withAuthor,
    });
  }

  remove(id: number) {
    return this.prisma.comment.delete({ where: { id } });
  }

  private async checkTaskExists(taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (task === null) {
      throw new NotFoundException(`Task #${taskId} not found`);
    }
  }
}

const withAuthor = {
  author: { select: { id: true, username: true } },
} satisfies Prisma.CommentInclude;
