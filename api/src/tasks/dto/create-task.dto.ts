import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Priority } from '../../generated/prisma/enums.js';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const builtDate = new Date(value);
    if (Number.isNaN(builtDate.getTime())) return value;
    return builtDate.toISOString().slice(0, 10) === value ? builtDate : value;
  })
  @IsDate({ message: 'due must be a valid date in YYYY-MM-DD format' })
  @IsOptional()
  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-10-29',
    required: false,
    nullable: true,
  })
  due?: Date | null;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsInt()
  @IsPositive()
  projectId!: number;
}
