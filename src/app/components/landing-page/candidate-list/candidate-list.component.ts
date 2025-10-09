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
  constructor(private recruiterService: RecruiterService) { }

  ngOnInit() {
    this.jobSubscription = this.recruiterService.selectedJob$.subscribe(
      (job) => {
        this.selectedJob = job;
        if (this.selectedJob) {
          this.fetchShortlistedCandidates();
        }
      }
    );
  }



  fetchShortlistedCandidates() {
    if (!this.selectedJob) return;

    console.log("print this", this.selectedJob);
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

  ngOnDestroy() {
    if (this.jobSubscription) {
      this.jobSubscription.unsubscribe();
    }
  }

  refreshList() {
    this.fetchShortlistedCandidates();
  }
}
