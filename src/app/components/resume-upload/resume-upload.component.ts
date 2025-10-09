import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  FormsModule,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AutoComplete } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';

import { RecruiterService } from '../../service/recruiter.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import * as mammoth from 'mammoth';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
    AutoComplete,
    ToastModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './resume-upload.component.html',
  styleUrls: ['./resume-upload.component.scss'],
  providers: [MessageService],
})
export class ResumeUploadComponent implements OnInit {
  hiringManager = '';
  hiringManagerId = '';
  filteredJobs: Job[] = [];
  uploadedFiles: File[] = [];
  showJobIdError = false;
  showUploadError = false;
  cachedJobs: Job[] = [];
  loading: boolean = false;
  private searchQuery$ = new Subject<string>();
  formGroup = new FormGroup({
    selectedJob: new FormControl<Job | null>(null),
  });

  constructor(
    private recruiterService: RecruiterService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.setupJobSelectionListener();
    this.searchQuery$
      .pipe(
        debounceTime(500),
        switchMap((query) => this.recruiterService.searchHMByJobId(query))
      )
      .subscribe((data: any) => {
        this.filteredJobs = data.result.map((item: any) => ({
          id: item.Id.toString(),
          title: item.HiringManagerId,
        }));
      });

  }

  private setupJobSelectionListener(): void {
    this.formGroup
      .get('selectedJob')
      ?.valueChanges.subscribe((value: Job | null) => {
        if (value) {
          this.hiringManager = value.title;
          this.hiringManagerId = value.id;
        }
      });
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

  filterJob(event: any): void {
    const query = event.query.toLowerCase();
    this.searchQuery$.next(query);
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
