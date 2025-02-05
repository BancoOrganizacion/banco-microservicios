import { Test, TestingModule } from '@nestjs/testing';
import { FingerprintsService } from './fingerprints.service';

describe('FingerprintsService', () => {
  let service: FingerprintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FingerprintsService],
    }).compile();

    service = module.get<FingerprintsService>(FingerprintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
