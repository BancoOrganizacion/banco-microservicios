import { Test, TestingModule } from '@nestjs/testing';
import { FingerprintsController } from './fingerprints.controller';

describe('FingerprintsController', () => {
  let controller: FingerprintsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FingerprintsController],
    }).compile();

    controller = module.get<FingerprintsController>(FingerprintsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
