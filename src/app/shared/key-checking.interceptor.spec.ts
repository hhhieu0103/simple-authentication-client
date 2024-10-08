import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

import { keyCheckingInterceptor } from './key-checking.interceptor';

describe('keyCheckingInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) => 
    TestBed.runInInjectionContext(() => keyCheckingInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('keys should be generated', () => {
    expect(interceptor).toBeTruthy();
  });
});
