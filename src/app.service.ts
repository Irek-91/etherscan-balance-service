import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MaxBalanceChangeResponse } from './interface/max-balance-change-response.interface';
import { BlockData } from './interface/block-data.interface';

@Injectable()
export class AppService {
  private readonly etherscanBaseUrl = 'https://api.etherscan.io/api';
  private readonly etherscanApiKey: string;
  private blockCache: Map<number, BlockData> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.etherscanApiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
  }

  async getMaxBalanceChange(): Promise<
    MaxBalanceChangeResponse | { error: string }
  > {
    try {
      const lastBlockNumber = await this.getLastBlockNumber();
      const startBlock = lastBlockNumber - 100;

      const balanceChanges: Map<string, bigint> = new Map();

      for (
        let blockNumber = startBlock;
        blockNumber <= lastBlockNumber;
        blockNumber++
      ) {
        const blockData = await this.getBlockByNumber(blockNumber);
        if (!blockData || !blockData.transactions) {
          return { error: `Failed to process block ${blockNumber}` };
        }

        blockData.transactions.forEach((tx) => {
          const from = tx.from.toLowerCase();
          const to = tx.to?.toLowerCase();
          const value = BigInt(tx.value);

          if (from) {
            balanceChanges.set(from, (balanceChanges.get(from) || 0n) - value);
          }

          if (to) {
            balanceChanges.set(to, (balanceChanges.get(to) || 0n) + value);
          }
        });
      }

      let maxChangeAddress = '';
      let maxChangeValue = 0n;

      console.log('Calculating max balance change...');

      for (const [address, change] of balanceChanges.entries()) {
        const absChange = change < 0n ? -change : change;
        if (absChange > maxChangeValue) {
          maxChangeValue = absChange;
          maxChangeAddress = address;
        }
      }

      console.log(`Max balance change found for address: ${maxChangeAddress}`);

      return {
        address: maxChangeAddress,
        balanceChange: maxChangeValue.toString(),
      };
    } catch (error) {
      return {
        error:
          'An unexpected error occurred while calculating max balance change.',
      };
    }
  }

  private async getLastBlockNumber(): Promise<number | null> {
    try {
      const url = `${this.etherscanBaseUrl}?module=proxy&action=eth_blockNumber&apikey=${this.etherscanApiKey}`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data.status === '0') {
        return null;
      }

      return parseInt(response.data.result, 16);
    } catch (error) {
      return null;
    }
  }

  private async getBlockByNumber(
    blockNumber: number,
  ): Promise<BlockData | null> {
    try {
      if (this.blockCache.has(blockNumber)) {
        return this.blockCache.get(blockNumber)!;
      }

      const hexBlockNumber = '0x' + blockNumber.toString(16);
      const url = `${this.etherscanBaseUrl}?module=proxy&action=eth_getBlockByNumber&tag=${hexBlockNumber}&boolean=true&apikey=${this.etherscanApiKey}`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data.status === '0') {
        return null;
      }

      const blockData: BlockData = response.data.result;
      this.blockCache.set(blockNumber, blockData);
      return blockData;
    } catch (error) {
      return null;
    }
  }
}
