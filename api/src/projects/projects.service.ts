import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto, userId: number) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        members: { create: { userId, role: 'OWNER' } },
      },
    });
  }

  findAll() {
    return this.prisma.project.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (project === null) {
      throw new NotFoundException(`Project #${id} not found`);
    }

    return project;
  }

  async update(id: number, userId: number, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    await this.assertMember(id, userId);

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);

    await this.assertMember(id, userId);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async assertMember(projectId: number, userId: number) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (member === null) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }
}
