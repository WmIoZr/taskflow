import { IsEnum, IsOptional } from 'class-validator';
import { Priority, Status } from '../../generated/prisma/enums.js';

export class FindTasksQueryDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
