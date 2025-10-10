import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { ResumeUploadComponent } from './components/resume-upload/resume-upload.component';
import { AuthGuard } from './service/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { 
    path: 'resume-repository', 
    component: LandingPageComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'resume-upload', 
    component: ResumeUploadComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];
