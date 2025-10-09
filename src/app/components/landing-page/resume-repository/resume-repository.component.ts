import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecruiterService } from '../../../service/recruiter.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-resume-repository',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './resume-repository.component.html',
  styleUrl: './resume-repository.component.scss',
})
export class ResumeRepositoryComponent implements OnInit {
  constructor(
    private router: Router,
    private recruiterService: RecruiterService
  ) { }
  jobs: any[] = [];
  isLoading: boolean = false;

  ngOnInit() {
    this.fetchJobDetails();
  }
  fetchJobDetails() {
    this.isLoading = true;
    this.recruiterService.getJobDetails().subscribe(
      (data: any) => {
        this.jobs = data.result;
        if (this.jobs.length > 0) {
          this.jobs[0].active = true;
          this.setActiveJob(this.jobs[0]);
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching job details:', error);
        this.isLoading = false; // Hide loader
      }
    );
  }
  getJobTitle(JD: string): string {
    try {
      const parsedJD = JSON.parse(JD);
      return parsedJD['Job Title'];
    } catch (e) {
      return '';
    }
  }

  setActiveJob(selectedJob: any) {
    const jobTitle = this.getJobTitle(selectedJob.JD);
    this.recruiterService.setSelectedJob(
      selectedJob.job_id,
      jobTitle,
      selectedJob.HiringManagerId
    );

    // Console log the selected job
    console.log('Selected Job:', {
      jobId: selectedJob.job_id,
      jobTitle: jobTitle,
      HMEmailId: selectedJob.HiringManagerId
    });

    this.jobs.forEach((job) => (job.active = false));
    selectedJob.active = true;
  }

  addResume() {
    this.router.navigate(['/resume-upload']);
  }
}
