import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecruiterService } from '../../../service/recruiter.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-resume-repository',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressSpinnerModule],
  templateUrl: './resume-repository.component.html',
  styleUrl: './resume-repository.component.scss',
})
export class ResumeRepositoryComponent implements OnInit {
  constructor(
    private router: Router,
    private recruiterService: RecruiterService
  ) { }
  jobs: any[] = [];
  filteredJobs: any[] = [];
  isLoading: boolean = false;
  searchQuery: string = '';

  ngOnInit() {
    this.fetchJobDetails();
  }
  fetchJobDetails() {
    this.isLoading = true;
    this.recruiterService.getJobDetails().subscribe(
      (data: any) => {
        this.jobs = data.result;
        this.filteredJobs = [...this.jobs]; // Initialize filtered jobs
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

    // Clear active state from all jobs
    this.jobs.forEach((job) => (job.active = false));
    // Set active state on selected job in the original jobs array
    const originalJob = this.jobs.find(job => job.job_id === selectedJob.job_id);
    if (originalJob) {
      originalJob.active = true;
    }
    // Also set active state on the selected job from filtered array
    selectedJob.active = true;
  }

  addResume() {
    this.router.navigate(['/resume-upload']);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.filterJobs();
  }

  filterJobs() {
    if (!this.searchQuery.trim()) {
      this.filteredJobs = [...this.jobs];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredJobs = this.jobs.filter(job => {
        const jobId = job.job_id?.toString().toLowerCase() || '';
        const jobTitle = this.getJobTitle(job.JD).toLowerCase() || '';
        const hiringManager = job.HiringManagerId?.toLowerCase() || '';
        
        return jobId.includes(query) || 
               jobTitle.includes(query) || 
               hiringManager.includes(query);
      });
    }
    
    // Preserve active state in filtered results
    this.filteredJobs.forEach(filteredJob => {
      const originalJob = this.jobs.find(job => job.job_id === filteredJob.job_id);
      if (originalJob) {
        filteredJob.active = originalJob.active;
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredJobs = [...this.jobs];
  }
}
