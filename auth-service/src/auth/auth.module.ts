import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RegistrationCode, RegistrationCodeSchema } from 'shared-models';
import { UsuariosModule } from '../../../users-microservice/src/usuarios/usuarios.module';
import { jwtConstants } from '../config/jwt.config';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: RegistrationCode.name, schema: RegistrationCodeSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Registrar explícitamente la estrategia por defecto
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
    UsuariosModule, // Asegurarse de que este módulo se importe correctamente
    TelegramModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}