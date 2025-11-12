import { CacheService } from 'src/cache/cache.service';

interface Cacheable {
  cache: CacheService;
}

type CacheKeyFn = (...args: any[]) => string;

export function Cached<T>(ttl: string, keyFn: CacheKeyFn): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: any[]) => T;

    descriptor.value = async function (this: Cacheable, ...args: string[]) {
      if (!this.cache) {
        throw new Error(
          'CacheService not available on "this". Ensure your class injects CacheService.',
        );
      }
      const cacheKey = keyFn(...args);

      const cached = await this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        console.log('returning from cache');
        return cached;
      }

      const result = (await originalMethod.apply(this, args)) as (
        ...args: any[]
      ) => Promise<T>;
      await this.cache.set(cacheKey, result, ttl);
      return result;
    };
    return descriptor;
  };
}
