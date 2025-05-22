import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';

// Importa los modelos y esquemas correctamente
import {
  PatronAutenticacion,
  PatronAutenticacionSchema,
  DedoPatron,
  DedoPatronSchema,
} from 'shared-models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatronAutenticacion.name, schema: PatronAutenticacionSchema },
      { name: DedoPatron.name, schema: DedoPatronSchema },
    ]),
  ],
  controllers: [PatternController],
  providers: [PatternService],
})
export class PatternModule {}
