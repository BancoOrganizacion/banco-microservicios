import { Test, TestingModule } from '@nestjs/testing';
import { FingerprintController } from './fingerprint.controller';

describe('FingerprintController', () => {
  let controller: FingerprintController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FingerprintController],
    }).compile();

    controller = module.get<FingerprintController>(FingerprintController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
