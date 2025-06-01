import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FingerprintModule } from './fingerprint/fingerprint.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [MongooseModule.forRoot('mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin'),FingerprintModule,
    ConfigModule.forRoot({
      isGlobal:true,
    }),
    JwtModule.register({
      global:true,
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions:{
        expiresIn: '5m'
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService ],
})
export class AppModule {}
