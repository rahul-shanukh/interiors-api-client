declare module "express" {
  export interface Request {
    traceId?: string;
  }
}
