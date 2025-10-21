import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GETurls, POSTurls } from '../config';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginResponse {
  isSuccess: boolean;
  message: string;
  result: {
    Id: number;
    IsHiringManager: string;
    UserId: string;
    email: string;
  };
  status: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root',
})
export class RecruiterService {
  constructor(private http: HttpClient) { }

  private selectedJobSubject = new BehaviorSubject<any>(null);
  selectedJob$ = this.selectedJobSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  currentUser$ = this.currentUserSubject.asObservable();

  setSelectedJob(jobId: number, jobTitle: string, email: string) {
    const jobDetails = { jobId, jobTitle, email };
    this.selectedJobSubject.next(jobDetails);
  }

  // Authentication methods
  login(email: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(POSTurls.loginRecruiter, { email }).pipe(
      tap((response) => {
        if (response.isSuccess) {
          this.setAuthData(response.result);
        }
      })
    );
  }

  private setAuthData(userData: any): void {
    localStorage.setItem('recruiterToken', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(userData);
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem('recruiterToken');
    const isAuth = localStorage.getItem('isAuthenticated');
    return !!(token && isAuth === 'true');
  }

  private getCurrentUser(): any {
    const userData = localStorage.getItem('recruiterToken');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  logout(): void {
    localStorage.removeItem('recruiterToken');
    localStorage.removeItem('isAuthenticated');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  getCurrentUserData(): any {
    return this.currentUserSubject.value;
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

  getJobDescription(jobId: number) {
    return this.http.get(GETurls.getJobDescriptionData(jobId));
  }

  jobSearch(query: string) {
    let params = new HttpParams();
    if (query != null && query !== '') {
      params = params.set('search', query);
    }
    return this.http.get(GETurls.jobSearch, { params });
  }

  searchHMByJobId(id: string) {
    return this.http.post(GETurls.searchHMByJobId, { id });
  }
}
