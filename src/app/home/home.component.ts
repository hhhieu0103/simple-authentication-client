import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { AuthenticationService } from '../shared/authentication.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgOptimizedImage,
    MatProgressSpinner,
    MatButtonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  router = inject(Router)
  authService = inject(AuthenticationService)
  isLoading = true

  constructor() {
    this.authService.isLogedIn().subscribe(isLogedIn => {
      this.isLoading = false
      if (!isLogedIn) this.router.navigate(['login'])
    })
  }
}
