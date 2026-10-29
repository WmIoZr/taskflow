import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
    });
    if (project === null) {
      throw new BadRequestException(
        `Project #${createTaskDto.projectId} does not exist`,
      );
    }

    return this.prisma.task.create({ data: createTaskDto });
  }

  findAll(query: FindTasksQueryDto) {
    return this.prisma.task.findMany({
      where: {
        status: query.status,
        priority: query.priority,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const foundTask = await this.prisma.task.findUnique({
      where: { id },
    });
    if (foundTask === null) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return foundTask;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  remove(id: number) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
