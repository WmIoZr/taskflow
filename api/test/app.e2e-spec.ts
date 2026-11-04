import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Task (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let newUserId: number | undefined;
  let newProjectId: number | undefined;
  let newTaskId: number | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  const registerDto = {
    email: `e2e_${Date.now()}@example.com`,
    username: 'WmIoZr',
    password: '122345678',
  };

  const loginDto = {
    email: registerDto.email,
    password: registerDto.password,
  };

  const projectDto = {
    name: 'SomeProj',
  };

  it('creates a task with a full flow', async () => {
    const regRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(regRes.body).toMatchObject({
      username: registerDto.username,
      email: registerDto.email,
      id: expect.any(Number),
    });
    expect(regRes.body).not.toHaveProperty('passwordHash');
    newUserId = regRes.body.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200);

    const accessToken = loginRes.body.accessToken;
    expect(accessToken).toEqual(expect.any(String));

    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(projectDto)
      .expect(201);

    expect(projectRes.body).toMatchObject({
      name: projectDto.name,
      id: expect.any(Number),
      createdAt: expect.any(String),
    });
    newProjectId = projectRes.body.id;

    const taskDto = {
      name: 'SomeTask',
      projectId: projectRes.body.id,
    };

    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(taskDto)
      .expect(201);

    expect(taskRes.body).toMatchObject({
      name: taskDto.name,
      projectId: taskDto.projectId,
      status: 'TODO',
      priority: 'MEDIUM',
      due: null,
      id: expect.any(Number),
      createdAt: expect.any(String),
    });
    newTaskId = taskRes.body.id;
  });

  afterAll(async () => {
    if (newTaskId !== undefined)
      await prisma.task.delete({ where: { id: newTaskId } });
    if (newProjectId !== undefined)
      await prisma.project.delete({ where: { id: newProjectId } });
    if (newUserId !== undefined)
      await prisma.user.delete({ where: { id: newUserId } });
    await app.close();
  });
});
