import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { MaxBalanceChangeResponse } from './interface/max-balance-change-response.interface';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('max-balance-change')
  async getMaxBalanceChange(): Promise<MaxBalanceChangeResponse> {
    const result = await this.appService.getMaxBalanceChange();

    if ('error' in result) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
