import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecruiterService } from '../../../service/recruiter.service';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-candidate-list',
  standalone: true,
  imports: [CommonModule, TooltipModule, ProgressSpinnerModule],
  templateUrl: './candidate-list.component.html',
  styleUrl: './candidate-list.component.scss',
})
export class CandidateListComponent implements OnInit {
  activeTab: string = 'Shortlisted';
  selectedJob: any = null;
  private jobSubscription!: Subscription;
  allCandidates: any[] = [];
  shortlistedCandidates: any[] = [];
  loading: boolean = false;
  constructor(private recruiterService: RecruiterService) {}

  ngOnInit() {
    this.fetchShortlistedCandidates();
    this.jobSubscription = this.recruiterService.selectedJob$.subscribe(
      (job) => {
        this.selectedJob = job;
        this.filterCandidatesByJob();
      }
    );
  }

  fetchShortlistedCandidates() {
    this.loading = true;
    this.recruiterService.getShortlistedCandidates().subscribe(
      (data: any) => {
        // Transform API data
        this.allCandidates = data.map((candidate: any) => ({
          name: [candidate.FirstName, candidate.MiddleName, candidate.LastName]
            .filter(Boolean)
            .join(' '),
          rating: candidate.Star,
          status: candidate.LatestStatus,
          experience: candidate.Experience,
          skills: candidate.Skills.split(','),
          jobId: candidate.JobId,
        }));

        this.filterCandidatesByJob();
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching shortlisted candidates:', error);
        this.loading = false;
      }
    );
  }

  filterCandidatesByJob() {
    this.shortlistedCandidates = this.allCandidates.filter((candidate: any) => {
      return candidate.jobId === this.selectedJob.jobId;
    });
  }

  getAdditionalSkills(skills: string[]): string {
    return skills.slice(2).join(', ');
  }

  ngOnDestroy() {
    if (this.jobSubscription) {
      this.jobSubscription.unsubscribe();
    }
  }

  refreshList() {
    this.fetchShortlistedCandidates();
  }
}
