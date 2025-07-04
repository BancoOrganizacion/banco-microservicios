import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';
import { CuentaApp, CuentaAppSchema, DedoRegistrado, PatronAutenticacion, PatronAutenticacionSchema,DedosRegistrados } from 'shared-models';
import { DedoPatron, DedoPatronSchema,Cuenta,CuentaSchema } from 'shared-models';
import { JwtDataGuard } from 'src/guards/jwt-data.guard';
import { RoleGuard } from 'src/guards/role.guard'; 
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatronAutenticacion.name, schema: PatronAutenticacionSchema },
      { name: DedoPatron.name, schema: DedoPatronSchema },
      {name:CuentaApp.name, schema:CuentaAppSchema},
      {name:Cuenta.name, schema: CuentaSchema},
      {name:DedoRegistrado.name, schema: DedosRegistrados}
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [PatternService,JwtDataGuard,RoleGuard],
  controllers: [PatternController],
  exports: [PatternService],
})
export class PatternModule {}
