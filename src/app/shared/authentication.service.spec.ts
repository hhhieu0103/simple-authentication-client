import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthenticationService, LoginInfo, SignupInfo } from './authentication.service';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let httpTestingController: HttpTestingController;
  const signupInfo: SignupInfo = {
    email: 'slime@mail.com',
    password: 'imagoodslime',
    username: 'mrslime',
  }
  const loginInfo: LoginInfo = {
    account: 'slime@mail.com',
    password: 'imagoodslime',
    keepLogin: true
  }
  const mockAccount = {
    id: self.crypto.randomUUID(),
    username: 'mrslime',
    email: 'slime@mail.com',
    status: 'Created',
    createdDate: new Date(),
    updatedDate: null
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthenticationService);
  });

  afterEach(() => {
    httpTestingController.verify()
  })

  it('#signup should create new account', (done: DoneFn) => {
    authService.signup(signupInfo).subscribe(res => {
      const account = sessionStorage.getItem('account')
      expect(res).toBe(mockAccount)
      expect(account).toBe(JSON.stringify(mockAccount))
      done()
    })

    const req = httpTestingController.expectOne(authService.baseUrl + 'signup')
    expect(req.request.method).toBe('POST')
    req.flush(mockAccount)
  });

  it('#signup should throw error for duplicated email or username', (done: DoneFn) => {
    const errorResponse = new HttpErrorResponse({
      error: 'Email is already in use',
      status: 409,
      statusText: 'Conflict',
    });

    authService.signup(signupInfo).subscribe({
      error: (err) => {
        expect(err.status).toBe(409)
        expect(err.statusText).toBe('Conflict')
        expect(err.error).toBe('Email is already in use')
        done()
      }
    })

    const req = httpTestingController.expectOne(authService.baseUrl + 'signup')
    expect(req.request.method).toBe('POST')
    req.flush('Email is already in use', errorResponse)
  });

  it('#login should sucessfully authenticate user', (done: DoneFn) => {
    authService.login(loginInfo).subscribe(res => {
      expect(res).toBe(mockAccount)
      const account = localStorage.getItem('account')
      expect(account).toBe(JSON.stringify(mockAccount))
      done()
    })

    const req = httpTestingController.expectOne(authService.baseUrl + 'login')
    expect(req.request.method).toBe('POST')
    req.flush(mockAccount)
  });

  it('#login should return error for missing login info', (done: DoneFn) => {
    const errorResponse = new HttpErrorResponse({
      error: 'Missing email or username',
      status: 422,
      statusText: 'Unprocessable Content',
    });

    authService.login({} as LoginInfo).subscribe({
      error: (err) => {
        expect(err.status).toBe(422)
        expect(err.statusText).toBe('Unprocessable Content')
        expect(err.error).toBe('Missing email or username')
        done()
      }
    })

    const req = httpTestingController.expectOne(authService.baseUrl + 'login')
    expect(req.request.method).toBe('POST')
    req.flush('Missing email or username', errorResponse)
  });

  it('#logout should clear session storage and local storage', (done: DoneFn) => {
    authService.logout().subscribe(res => {
      expect(localStorage.length).toBe(0)
      expect(sessionStorage.length).toBe(0)
      done()
    })

    const req = httpTestingController.expectOne(authService.baseUrl + 'logout')
    expect(req.request.method).toBe('POST')
    req.flush(null)
  });

  it('#isLogedIn', (done: DoneFn) => {
    authService.isLogedIn().subscribe(res => {
      expect(res).toBe(true)
      done()
    })

    const req = httpTestingController.expectOne(authService.baseUrl + 'isLogedIn')
    expect(req.request.method).toBe('GET')
    req.flush(true)
  });
});
