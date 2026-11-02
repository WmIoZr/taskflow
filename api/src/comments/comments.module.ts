import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';
import { ProjectsModule } from '../projects/projects.module.js';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  imports: [ProjectsModule],
})
export class CommentsModule {}
