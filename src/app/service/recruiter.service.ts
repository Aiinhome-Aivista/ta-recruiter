import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GETurls, POSTurls } from '../config';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecruiterService {
  constructor(private http: HttpClient) {}

  private selectedJobSubject = new BehaviorSubject<any>(null);
  selectedJob$ = this.selectedJobSubject.asObservable();

  setSelectedJob(jobId: number, jobTitle: string, email: string) {
    const jobDetails = { jobId, jobTitle, email };
    this.selectedJobSubject.next(jobDetails);
  }

  // uploadCVs(jobId: string, recruiterEmail: string, files: File[]) {
  //   const formData = new FormData();
  //   files.forEach((file) => {
  //     formData.append('CVs', file, file.name);
  //   });

  //   const headers = new HttpHeaders({
  //     accept: '/',
  //   });

  //   return this.http.post(
  //     `${POSTurls.uploadCVs}?JobId=${jobId}&RecruiterEmail=${recruiterEmail}`,
  //     formData,
  //     { headers }
  //   );
  // }

  uploadCVs(jobId: string, hiringManagerId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));

    // Append IDs as part of form-data instead of query params
    formData.append('job_id', jobId);
    formData.append('HiringManagerId', hiringManagerId);

    const headers = new HttpHeaders({ accept: '/' });

    return this.http.post(POSTurls.uploadCVs, formData, { headers });
  }

  getJobDetails() {
    return this.http.get(GETurls.getJobDetails);
  }

  getShortlistedCandidates(jobId: number) {
    return this.http.get(GETurls.getShortlistedCandidates(jobId));
  }

  // searchHMByJobId(jobId: string) {
  //   return this.http.get(`${GETurls.searchHMByJobId}?jobId=${jobId}`);
  // }
  // service
  searchHMByJobId(id: string) {
    return this.http.post(`${GETurls.searchHMByJobId}`, { id });
  }
}
