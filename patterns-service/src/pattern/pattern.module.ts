import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';
import { CuentaApp, CuentaAppSchema, PatronAutenticacion, PatronAutenticacionSchema } from 'shared-models';
import { DedoPatron, DedoPatronSchema } from 'shared-models';
import { Schema as MongooseSchema } from 'mongoose';
import { JwtDataGuard } from 'src/guards/jwt-data.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatronAutenticacion.name, schema: PatronAutenticacionSchema },
      { name: DedoPatron.name, schema: DedoPatronSchema },
      {name:CuentaApp.name, schema:CuentaAppSchema},
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [PatternService,JwtDataGuard],
  controllers: [PatternController],
  exports: [PatternService],
})
export class PatternModule {}
