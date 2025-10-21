import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  FormsModule,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AutoComplete } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';

import { RecruiterService } from '../../service/recruiter.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import * as mammoth from 'mammoth';
import {
  debounceTime,
  switchMap,
  distinctUntilChanged,
  catchError,
  map,
} from 'rxjs/operators';
import { Subject, Subscription, of } from 'rxjs';

interface Job {
  id: string;
  title: string;
}

@Component({
  selector: 'app-resume-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    AutoCompleteModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './resume-upload.component.html',
  styleUrls: ['./resume-upload.component.scss'],
  providers: [MessageService],
})
export class ResumeUploadComponent implements OnInit, OnDestroy {
  @ViewChild('ac') ac?: AutoComplete;

  hiringManager = '';
  hiringManagerId = '';
  filteredJobs: Job[] = [];
  uploadedFiles: File[] = [];
  showJobIdError = false;
  showUploadError = false;
  cachedJobs: Job[] = [];
  loading: boolean = false;
  pendingDropdownRequest = false;

  private searchQuery$ = new Subject<string>();
  private searchSub?: Subscription;

  formGroup = new FormGroup({
    selectedJob: new FormControl<Job | null>(null),
  });

  constructor(
    private recruiterService: RecruiterService,
    private messageService: MessageService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupJobSelectionListener();

    this.searchSub = this.searchQuery$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((query) =>
          this.recruiterService.jobSearch(query).pipe(
            map((data: any) => {
              const items = data?.result ?? data?.data ?? data ?? [];
              return (items || []).map((item: any) => ({
                id: (item.job_id ?? item.jobId ?? item.id ?? '').toString(),
                title: item['Job Title'] ?? item.jobTitle ?? item.title ?? '',
              })) as Job[];
            }),
            catchError((err) => {
              console.error('jobSearch API error', err);
              return of([] as Job[]);
            })
          )
        )
      )
      .subscribe((jobs: Job[]) => {
        this.filteredJobs = jobs || [];
        if (jobs?.length) this.cachedJobs = jobs;

        if (this.pendingDropdownRequest) {
          this.pendingDropdownRequest = false;
          this.cd.detectChanges();
          setTimeout(() => this.ac?.show(), 0);
        } else {
          this.cd.detectChanges();
        }
      });


  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  private setupJobSelectionListener(): void {
    this.formGroup
      .get('selectedJob')
      ?.valueChanges.subscribe((value: Job | null) => {
        if (value) {
          const selectedJobId = value.id;
          this.hiringManagerId = selectedJobId;

          // Now fetch Hiring Manager info for this job id using searchHMByJobId
          this.recruiterService.searchHMByJobId(selectedJobId).subscribe({
            next: (data: any) => {
              const item =
                (data?.result && data.result[0]) ??
                (data?.data && data.data[0]) ??
                data?.[0] ??
                null;

              if (item) {
                this.hiringManager = item.HiringManagerId ?? item.hiringManager ?? '';
                this.hiringManagerId = item.Id ?? selectedJobId;
              } else {
                this.hiringManager = '';
                this.hiringManagerId = selectedJobId;
              }
            },
            error: (err) => {
              console.error('searchHMByJobId error', err);
              this.hiringManager = '';
              this.hiringManagerId = selectedJobId;
            },
          });
        } else {
          this.hiringManager = '';
          this.hiringManagerId = '';
        }
      });
  }

  // Called by p-autocomplete's completeMethod
  filterJob(event: any): void {
    const rawQuery = (event?.query ?? '').toString();
    const query = rawQuery.trim();

    if (!query) {
      if (this.cachedJobs && this.cachedJobs.length > 0) {
        this.filteredJobs = [...this.cachedJobs]; 
        this.cd.detectChanges();
      } else {
        this.filteredJobs = [];
        this.searchQuery$.next('');
      }

      setTimeout(() => {
        try {
          this.ac?.show();
        } catch (err) {
        }
      }, 0);

      return;
    }

    // If we already have cachedJobs, do fast client-side filter immediately for snappy UX
    if (this.cachedJobs && this.cachedJobs.length > 0) {
      const q = query.toLowerCase();
      this.filteredJobs = this.cachedJobs.filter((job) =>
        (job.title ?? '').toString().toLowerCase().includes(q) || String(job.id).includes(q)
      );

      // make sure overlay refreshes
      this.cd.detectChanges();
      setTimeout(() => {
        try {
          this.ac?.show();
        } catch (err) {
        }
      }, 0);

      return;
    }

    this.searchQuery$.next(query);
  }

  // Called when user clicks the dropdown arrow (wire (onDropdownClick)="onJobDropdownClick()" in template)
  onJobDropdownClick(): void {
    // If we have cached items, show them immediately
    if (this.cachedJobs && this.cachedJobs.length > 0) {
      this.filteredJobs = [...this.cachedJobs];
      this.cd.detectChanges();
      setTimeout(() => this.ac?.show(), 0);
      return;
    }

    // No cache → request initial list but DO NOT open overlay yet
    this.filteredJobs = [];
    this.pendingDropdownRequest = true;
    this.searchQuery$.next('');
  }



  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const selectedFiles = Array.from(target.files).filter((file) =>
        this.isSupportedFileType(file.type)
      );

      this.addUniqueFiles(selectedFiles);
    }
  }

  private isSupportedFileType(type: string): boolean {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ].includes(type);
  }

  private addUniqueFiles(files: File[]): void {
    files.forEach((file) => {
      if (
        !this.uploadedFiles.some(
          (existingFile) => existingFile.name === file.name
        )
      ) {
        this.uploadedFiles.push(file);
      }
    });
  }

  removeFile(file: File): void {
    this.uploadedFiles = this.uploadedFiles.filter((f) => f !== file);
  }

  previewFile(file: File): void {
    switch (file.type) {
      case 'application/pdf':
        this.openFileInNewTab(URL.createObjectURL(file));
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        this.previewDocx(file);
        break;
      case 'application/msword':
        this.previewDoc(file);
        break;
      default:
        this.messageService.add({
          severity: 'warn',
          summary: 'Unsupported',
          detail: 'File type not supported for preview',
        });
    }
  }

  private openFileInNewTab(fileURL: string): void {
    window.open(fileURL, '_blank');
  }

  private previewDocx(file: File): void {
    const reader = new FileReader();

    reader.onload = async (event: any) => {
      const arrayBuffer = event.target.result;
      const result = await mammoth.convertToHtml({ arrayBuffer });
      this.openFileInNewTabWithContent(result.value);
    };

    reader.readAsArrayBuffer(file);
  }

  private previewDoc(file: File): void {
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const textContent = event.target.result;
      this.openFileInNewTabWithContent(`<pre>${textContent}</pre>`);
    };

    reader.readAsText(file);
  }

  private openFileInNewTabWithContent(content: string): void {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(content);
    }
  }

  saveCVs(): void {
    if (!this.validateInputs()) {
      return;
    }

    const recruiterEmail = 'testHR@email.com';
    this.loading = true;

    this.recruiterService
      .uploadCVs(this.hiringManagerId, this.hiringManager, this.uploadedFiles)
      .subscribe({
        next: () => {
          this.showSuccessMessage('CVs uploaded successfully!');
          this.resetForm();
          this.navigateToRepository();
        },
        error: () => this.showErrorMessage('CV upload failed!'),
        complete: () => (this.loading = false), // Stop spinner
      });
  }

  private validateInputs(): boolean {
    let isValid = true;
    this.showJobIdError = !this.hiringManagerId;
    this.showUploadError = this.uploadedFiles.length === 0;

    if (this.showJobIdError || this.showUploadError) {
      isValid = false;
    }

    return isValid;
  }

  private showSuccessMessage(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail,
    });
  }

  private showErrorMessage(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  private resetForm(): void {
    this.uploadedFiles = [];
    this.formGroup.reset();
  }

  private navigateToRepository(): void {
    setTimeout(() => this.router.navigate(['/resume-repository']), 2000);
  }

  goBack(): void {
    this.router.navigate(['/resume-repository']);
  }
}
