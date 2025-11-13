import { Request } from 'express';

export interface UserRequestInterface extends Request {
  user: { id: string };
}
