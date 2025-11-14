import { Injectable, Logger } from '@nestjs/common';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextTry: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private states: Map<string, CircuitBreakerState> = new Map();
  
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000;

  canExecute(service: string): boolean {
    const now = Date.now();
    const state = this.states.get(service) || {
      failures: 0,
      lastFailure: 0,
      state: 'CLOSED',
      nextTry: 0,
    };

    if (state.state === 'OPEN') {
      if (now >= state.nextTry) {
        state.state = 'HALF_OPEN';
        this.logger.log(`Circuit breaker for ${service} moved to HALF_OPEN`);
        return true;
      }
      return false;
    }

    return true;
  }

  onSuccess(service: string): void {
    const state = this.states.get(service);
    if (state) {
      state.failures = 0;
      state.state = 'CLOSED';
      this.states.set(service, state);
    }
  }

  onFailure(service: string): void {
    const now = Date.now();
    let state = this.states.get(service) || {
      failures: 0,
      lastFailure: now,
      state: 'CLOSED',
      nextTry: 0,
    };

    state.failures++;
    state.lastFailure = now;

    if (state.failures >= this.failureThreshold) {
      state.state = 'OPEN';
      state.nextTry = now + this.resetTimeout;
      this.logger.warn(`Circuit breaker opened for ${service}`);
    }

    this.states.set(service, state);
  }

  getState(service: string): CircuitBreakerState {
    return this.states.get(service) || {
      failures: 0,
      lastFailure: 0,
      state: 'CLOSED',
      nextTry: 0,
    };
  }
}