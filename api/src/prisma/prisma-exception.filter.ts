import {
  Catch,
  ArgumentsHost,
  HttpException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { BaseExceptionFilter } from '@nestjs/core';
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    super.catch(toHttpException(exception) ?? exception, host);
  }
}

function toHttpException(
  exception: Prisma.PrismaClientKnownRequestError,
): HttpException | undefined {
  switch (exception.code) {
    case 'P2002': {
      return new ConflictException(
        'Unique constraint failed. Resource already exists',
      );
    }
    case 'P2003': {
      return new ConflictException(
        'Foreign key constraint failed. Resource is referenced by other records',
      );
    }
    case 'P2025': {
      return new NotFoundException('Resource not found');
    }
    default: {
      return undefined;
    }
  }
}
