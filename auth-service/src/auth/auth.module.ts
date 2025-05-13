import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RegistrationCode, RegistrationCodeSchema } from 'shared-models';
import { UsersClientModule } from '../users-client/users-client.module';
import { TelegramModule } from '../telegram/telegram.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConstants } from '../config/jwt.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrationCode.name, schema: RegistrationCodeSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', jwtConstants.secret),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', jwtConstants.expiresIn),
          algorithm: configService.get<string>('JWT_ALGORITHM', 'HS256') as any,
        },
      }),
      inject: [ConfigService],
    }),
    UsersClientModule,
    TelegramModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}