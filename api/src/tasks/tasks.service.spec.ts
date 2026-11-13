import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('TasksService', () => {
  let taskService: TasksService;
  const prismaMock = {
    task: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    project: { findUnique: vi.fn() },
  };
  const projectsServiceMock = { assertMember: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ProjectsService, useValue: projectsServiceMock },
      ],
    }).compile();

    taskService = moduleRef.get(TasksService);
  });

  describe('create', () => {
    const createDto: CreateTaskDto = {
      name: 'some',
      projectId: 999,
    };
    const userId = 1;

    it('throws BadRequestException when the project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(taskService.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the user is not a member of the project', async () => {
      projectsServiceMock.assertMember.mockRejectedValue(
        new ForbiddenException(),
      );
      prismaMock.project.findUnique.mockResolvedValue({ id: 999 });

      await expect(taskService.create(createDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('creates a new task when input is correct', async () => {
      projectsServiceMock.assertMember.mockResolvedValue(undefined);
      prismaMock.project.findUnique.mockResolvedValue({ id: 999 });
      const createdTask = { id: 1, ...createDto };
      prismaMock.task.create.mockResolvedValue(createdTask);

      await expect(taskService.create(createDto, userId)).resolves.toBe(
        createdTask,
      );
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(projectsServiceMock.assertMember).toHaveBeenCalledWith(
        createDto.projectId,
        userId,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when task is missing', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      const taskId = 1;
      const userId = 1;
      const updateTaskDto = {};
      await expect(
        taskService.update(taskId, userId, updateTaskDto),
      ).rejects.toThrow(NotFoundException);
      expect(projectsServiceMock.assertMember).not.toHaveBeenCalled();
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });
  });
});
