import { Component } from '@angular/core';
import { ResumeRepositoryComponent } from './resume-repository/resume-repository.component';
import { CandidateListComponent } from './candidate-list/candidate-list.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [ResumeRepositoryComponent, CandidateListComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {}
