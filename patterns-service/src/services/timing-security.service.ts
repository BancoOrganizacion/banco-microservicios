import { Injectable } from '@nestjs/common';

@Injectable()
export class TimingSecurityService {
  private readonly MINIMUM_RESPONSE_TIME = 1000; // 1 segundo mínimo
  private readonly MAXIMUM_RESPONSE_TIME = 3000; // 3 segundos máximo
  
  /**
   * Asegura que la respuesta tarde un tiempo mínimo y aleatorio
   * para prevenir timing attacks
   */
  async normalizeResponseTime(startTime: number): Promise<void> {
    const elapsedTime = Date.now() - startTime;
    
    // Calcular delay necesario con algo de randomización
    const randomDelay = Math.floor(Math.random() * 1000) + 500; // 500ms - 1500ms aleatorio
    const minimumTotalTime = this.MINIMUM_RESPONSE_TIME + randomDelay;
    
    if (elapsedTime < minimumTotalTime) {
      const delayNeeded = minimumTotalTime - elapsedTime;
      await this.delay(delayNeeded);
    }
    
    // Si ya pasó mucho tiempo, agregar un delay pequeño aleatorio
    if (elapsedTime > this.MAXIMUM_RESPONSE_TIME) {
      await this.delay(Math.floor(Math.random() * 500) + 200); // 200-700ms
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
