import { Controller, Get, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';
import { Public } from 'src/common/decorators/roles.decorator';

// TODO: Import your specific decorator that bypasses your session/auth guards
// import { Public } from '../../common/decorators/public.decorator';
@Public() // <-- This is a custom decorator you need to implement to mark this route as public
@Controller('metrics') // With your global prefix, this becomes /api/v1/metrics
export class MetricsController extends PrometheusController {
  @Get()
  // @Public() <-- ADD YOUR DECORATOR HERE to bypass the 403 Forbidden
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
