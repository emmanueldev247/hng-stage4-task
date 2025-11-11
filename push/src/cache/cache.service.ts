import { Inject, Injectable } from '@nestjs/common';
import { Cacheable } from 'cacheable';

@Injectable()
export class CacheService {
  static instance: CacheService;

  constructor(@Inject('CACHE_INSTANCE') private readonly cache: Cacheable) {}

  async get<T = any>(key: string): Promise<T | undefined> {
    return await this.cache.get<T>(key);
  }

  async set<T = any>(
    key: string,
    value: T,
    ttl?: number | string,
  ): Promise<void> {
    await this.cache.set<T>(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}
