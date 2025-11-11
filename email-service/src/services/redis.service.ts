// src/services/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      url: this.configService.get<string>('REDIS_URL'),
    });

    this.client.on('error', (err) => console.log('Redis Client Error', err));
    
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async increment(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }
}