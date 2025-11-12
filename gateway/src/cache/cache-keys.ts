export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  template: (code: string) => `template:${code}`,
  // add more as needed
};
