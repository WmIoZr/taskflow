import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './jwt-payload.js';

export const CurrentUser = createParamDecorator(
  (data: unknown, executionContext: ExecutionContext) => {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    if (request.user === undefined) {
      throw new UnauthorizedException('Current user is not found');
    }
    return request.user;
  },
);
