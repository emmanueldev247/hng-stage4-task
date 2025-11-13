import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

const logger = new Logger('HTTP');

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    logger.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${elapsed}ms`,
    );
  });
  next();
}
