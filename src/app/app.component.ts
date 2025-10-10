import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { RecruiterService } from './service/recruiter.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  showHeader: boolean = true;
  currentUser: any;
  isAuthenticated: boolean = false;
  showDropdown: boolean = false;

  constructor(
    private router: Router,
    private recruiterService: RecruiterService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Show header for authenticated routes, hide for login
        const loginPage = event.urlAfterRedirects === '/' || event.urlAfterRedirects === '';
        this.showHeader = !loginPage && this.isAuthenticated;
      }
    });
  }

  ngOnInit() {
    // Subscribe to authentication state
    this.recruiterService.isAuthenticated$.subscribe(
      (isAuth) => {
        this.isAuthenticated = isAuth;
        this.updateHeaderVisibility();
      }
    );

    // Subscribe to current user data
    this.recruiterService.currentUser$.subscribe(
      (user) => {
        this.currentUser = user;
      }
    );
  }

  private updateHeaderVisibility() {
    const currentUrl = this.router.url;
    const loginPage = currentUrl === '/' || currentUrl === '';
    this.showHeader = !loginPage && this.isAuthenticated;
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.showDropdown = false;
    this.recruiterService.logout();
    this.router.navigate(['']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile-container')) {
      this.showDropdown = false;
    }
  }
}
