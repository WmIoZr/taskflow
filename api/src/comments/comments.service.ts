import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { ProjectsService } from '../projects/projects.service.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(
    taskId: number,
    authorId: number,
    createCommentDto: CreateCommentDto,
  ) {
    const task = await this.findTask(taskId);

    await this.projectsService.assertMember(task.projectId, authorId);

    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        authorId,
        taskId,
      },
      include: withAuthor,
    });
  }

  async findAll(taskId: number) {
    await this.findTask(taskId);
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

  async update(id: number, userId: number, updateCommentDto: UpdateCommentDto) {
    await this.assertCommentWithMember(id, userId);

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: withAuthor,
    });
  }

  async remove(id: number, userId: number) {
    await this.assertCommentWithMember(id, userId);

    return this.prisma.comment.delete({ where: { id } });
  }

  private async findTask(taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (task === null) {
      throw new NotFoundException(`Task #${taskId} not found`);
    }

    return task;
  }

  private async assertCommentWithMember(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { task: { select: { projectId: true } } },
    });
    if (comment === null) {
      throw new NotFoundException(`Comment #${id} not found`);
    }

    await this.projectsService.assertMember(comment.task.projectId, userId);
  }
}

const withAuthor = {
  author: { select: { id: true, username: true } },
} satisfies Prisma.CommentInclude;
