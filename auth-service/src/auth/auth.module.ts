import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RegistrationCode, RegistrationCodeSchema } from './schemas/registration-code.schema';
import { UsuariosModule } from '../../../users-microservice/src/usuarios/usuarios.module';
import { jwtConstants } from '../config/jwt.config';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrationCode.name, schema: RegistrationCodeSchema },
    ]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
    UsuariosModule,
     
  ],
  
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}