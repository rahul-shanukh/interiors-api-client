// Backend/interiors-api-client/src/common/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}

export {};
