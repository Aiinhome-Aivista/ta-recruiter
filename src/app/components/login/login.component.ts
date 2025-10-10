import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecruiterService } from '../../service/recruiter.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  email: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private recruiterService: RecruiterService
  ) {}

  ngOnInit() {
    // Redirect if already authenticated
    if (this.recruiterService.isAuthenticated()) {
      this.router.navigate(['/resume-repository']);
    }
  }

  login() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.recruiterService.login(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.isSuccess) {
          this.router.navigate(['/resume-repository']);
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Login failed. Please try again.';
        console.error('Login error:', error);
      }
    });
  }
}
