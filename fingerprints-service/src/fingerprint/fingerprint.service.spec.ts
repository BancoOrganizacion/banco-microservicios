import { Test, TestingModule } from '@nestjs/testing';
import { FingerprintService } from './fingerprint.service';

describe('FingerprintService', () => {
  let service: FingerprintService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FingerprintService],
    }).compile();

    service = module.get<FingerprintService>(FingerprintService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
