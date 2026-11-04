import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { ProjectsModule } from '../projects/projects.module.js';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [ProjectsModule],
})
export class TasksModule {}
