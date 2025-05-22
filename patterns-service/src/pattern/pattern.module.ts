import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';
import { PatronAutenticacion, PatronAutenticacionSchema } from 'shared-models';
import { DedoPatron, DedoPatronSchema } from 'shared-models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatronAutenticacion.name, schema: PatronAutenticacionSchema },
      { name: DedoPatron.name, schema: DedoPatronSchema },
    ]),
  ],
  providers: [PatternService],
  controllers: [PatternController],
  exports: [PatternService],
})
export class PatternModule {}
