import { Request } from 'express';

declare module 'express' {
  export interface Request {
    traceId?: string;
  }
}
