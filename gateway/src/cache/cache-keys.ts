export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  template: (code: string) => `template:${code}`,
  userContact: (userId: string) => `user-contact:${userId}`,
  // add more as needed
};
