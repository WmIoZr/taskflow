import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto.js';
import { Status } from '../../generated/prisma/enums.js';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['projectId'] as const),
) {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
