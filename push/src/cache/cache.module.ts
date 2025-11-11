import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { Cacheable } from 'cacheable';
import { createKeyv } from '@keyv/redis';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'CACHE_INSTANCE',
      useFactory: (config: ConfigService) => {
        const redisUrl =
          config.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const secondary = createKeyv(redisUrl);
        return new Cacheable({ secondary, ttl: '4h' });
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
