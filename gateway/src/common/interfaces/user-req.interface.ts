import { Request } from 'express';

export interface UserRequestInterface extends Request {
  user_id: string;
}
