import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ResumeUploadComponent } from './components/resume-upload/resume-upload.component';

export const routes: Routes = [
  // { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '', component: LoginComponent },
  { path: 'resume-repository', component: LandingPageComponent },
  { path: 'resume-upload', component: ResumeUploadComponent },
];
