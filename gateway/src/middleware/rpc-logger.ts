import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class RpcLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RMQ');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<'rpc'>() !== 'rpc') {
      return next.handle();
    }

    const rmq = context.switchToRpc().getContext<RmqContext>();
    const msg = rmq.getMessage();
    const pattern = rmq.getPattern?.() ?? msg?.fields?.routingKey;

    const start = Date.now();
    const corr = msg?.properties?.correlationId;
    const headers = msg?.properties?.headers;

    this.logger.log(
      `▶︎ recv pattern=${pattern} corr=${corr ?? '-'} headers=${JSON.stringify(headers ?? {})}`,
    );

    return next.handle().pipe(
      catchError((err) => {
        const elapsed = Date.now() - start;
        this.logger.error(
          `✖ pattern=${pattern} corr=${corr ?? '-'} ${elapsed}ms error=${err?.message ?? err}`,
        );
        throw err;
      }),
      finalize(() => {
        const elapsed = Date.now() - start;
        this.logger.log(
          `✔︎ ack  pattern=${pattern} corr=${corr ?? '-'} ${elapsed}ms`,
        );
      }),
    );
  }
}
