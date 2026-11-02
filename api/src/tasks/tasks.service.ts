import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';
import { ProjectsService } from '../projects/projects.service.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
    });
    if (project === null) {
      throw new BadRequestException(
        `Project #${createTaskDto.projectId} does not exist`,
      );
    }

    await this.projectsService.assertMember(createTaskDto.projectId, userId);

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

  async update(id: number, userId: number, updateTaskDto: UpdateTaskDto) {
    await this.assertTaskWithMember(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(id: number, userId: number) {
    await this.assertTaskWithMember(id, userId);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  private async assertTaskWithMember(id: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (task === null) {
      throw new NotFoundException(`Task #${id} not found`);
    }

    await this.projectsService.assertMember(task.projectId, userId);
  }
}
