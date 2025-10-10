import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RecruiterService } from './recruiter.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private recruiterService: RecruiterService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.recruiterService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}