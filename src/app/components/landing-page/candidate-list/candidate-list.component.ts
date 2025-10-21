import { Component, OnInit, OnDestroy } from '@angular/core';
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
  styleUrls: ['./candidate-list.component.scss'],
})
export class CandidateListComponent implements OnInit, OnDestroy {
  activeTab: string = 'Shortlisted';
  selectedJob: any = null;
  private jobSubscription!: Subscription;
  allCandidates: any[] = [];
  shortlistedCandidates: any[] = [];
  loading: boolean = false;
  jobDescription: any = null;
  jobDescriptionLoading: boolean = false;

  constructor(private recruiterService: RecruiterService) { }

  ngOnInit() {
    this.jobSubscription = this.recruiterService.selectedJob$.subscribe(
      (job) => {
        this.selectedJob = job;
        if (this.selectedJob) {
          this.fetchShortlistedCandidates();
          this.fetchJobDescription();
        }
      }
    );
  }

  // === Fetch Shortlisted Candidates (existing) ===
  fetchShortlistedCandidates() {
    if (!this.selectedJob) return;

    this.loading = true;
    this.recruiterService.getShortlistedCandidates(this.selectedJob.jobId)
      .subscribe(
        (data: any) => {
          this.allCandidates = data.result.map((candidate: any) => ({
            name: [candidate.first_name, candidate.middle_name, candidate.last_name]
              .filter(Boolean)
              .join(' '),
            rating: candidate.star,
            status: candidate.latestStatus,
            experience: candidate.experience,
            skills: candidate.skills.split(','),
            jobId: candidate.jobId,
            email: candidate.email,
            latestRole: candidate.latestrole,
            education: candidate.education
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

  // === Fetch Job Description from API ===
  fetchJobDescription() {
    if (!this.selectedJob) return;

    this.jobDescriptionLoading = true;
    this.recruiterService.getJobDescription(this.selectedJob.jobId)
      .subscribe({
        next: (response: any) => {
          if (response?.isSuccess && response.jd) {
            const jd = response.jd;

            this.jobDescription = {
              ...jd,
              'Key Responsibilities': jd['Key Responsibilities'] ? jd['Key Responsibilities'].split('\n') : [],
              'Desired Skills': jd['Desired Skills'] ? jd['Desired Skills'].split('\n') : [],
              'Qualifications': jd['Qualifications'] ? jd['Qualifications'].split('\n') : [],
              'Benefits': jd['Benefits'] || []
            };
          } else {
            this.jobDescription = null;
          }
          this.jobDescriptionLoading = false;
        },
        error: (err) => {
          console.error('Error fetching job description', err);
          this.jobDescription = null;
          this.jobDescriptionLoading = false;
        }
      });
  }


  refreshList() {
    this.fetchShortlistedCandidates();
    this.fetchJobDescription();
  }

  ngOnDestroy() {
    if (this.jobSubscription) {
      this.jobSubscription.unsubscribe();
    }
  }
}
