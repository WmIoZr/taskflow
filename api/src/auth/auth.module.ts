import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = Number(
          config.getOrThrow<string>('JWT_EXPIRES_IN_SECONDS'),
        );
        if (!Number.isInteger(expiresIn) || expiresIn <= 0) {
          throw new Error(
            'JWT_EXPIRES_IN_SECONDS must be a positive whole number',
          );
        }

        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: Number(
              config.getOrThrow<string>('JWT_EXPIRES_IN_SECONDS'),
            ),
          },
        };
      },
    }),
  ],
})
export class AuthModule {}
