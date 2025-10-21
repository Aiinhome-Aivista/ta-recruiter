import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { RecruiterService } from '../../../service/recruiter.service';
import { MessageService } from "primeng/api";
import { Toast } from "primeng/toast";
import { DatePipe } from "@angular/common";
import { ProgressSpinner } from "primeng/progressspinner";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBarModule } from "primeng/progressbar";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-candidate-info",
  standalone: true,
  imports: [
    CommonModule,
    Toast,
    ProgressSpinner,
    TooltipModule,
    ProgressBarModule,
    FormsModule,
  ],
  templateUrl: "./candidate-info.component.html",
  styleUrl: "./candidate-info.component.scss",
  providers: [MessageService, DatePipe],
})
export class CandidateInfoComponent {
  @Input() candidate: any;
  @Output() close: EventEmitter<string> = new EventEmitter<string>();
  isInterviewScheduled: boolean = true;
  isSelected: boolean = true;
  activeTab: string = ""; // Store the active tab information
  constructor(
    private recruiterService: RecruiterService,
    private messageService: MessageService,
    private datepipe: DatePipe
  ) {}

  candidateStatus: string = "";
  showHiddenSkills: boolean = false;
  jobSubscribe: any;
  assessmentDetails: any[] = []; // Store the assessment details from the API
  component: string = ""; // Store the name of the pending component
  selectedCandidateDetails: any;
  interviewTime: any;
  loader: boolean = true;
  showMatchingParcentage: boolean = false;
  hasApiError: boolean = false;
  button_enable: boolean = false; // default: disabled until API status known

  interviewData = {
    joinStatus: "",
    feedback: "",
    selectionStatus: "",
  };
  
  // Interview feedback form properties
  isInterviewFormLoading: boolean = false;
  isSubmittingInterview: boolean = false;

  // Enable/disable submit based solely on API's SelectionStatus
  canEditBasedOnApi: boolean = false;

  ngOnInit() {
    this.loader = true;
    //console.log('Hello World', this.candidate);

    // Extract active tab information
    if (this.candidate && this.candidate.activeTab) {
      this.activeTab = this.candidate.activeTab;
      console.log("Active Tab:", this.activeTab);
    }

    this.getCandidateStatus(this.candidate);

    // Store the status in a variable
    if (this.candidate && this.candidate.latestStatus) {
      this.candidateStatus = this.candidate.latestStatus;
      // console.log('Candidate Status:', this.candidateStatus);
    }
    if (this.candidateStatus === "Interview Scheduled") {
      this.isInterviewScheduled = true;
    } else {
      this.isInterviewScheduled = false;
    }
    // console.log('candidate', this.candidate);

    if (this.candidateStatus === "Interview Completed") {
      this.isSelected = true;
    } else {
      this.isSelected = false;
    }

    const jsonBody = {
      email: this.candidate.email,
    };
    this.recruiterService.CandidateDetails(jsonBody).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          this.selectedCandidateDetails = res.result;
          this.hasApiError = false;
          //  console.log('selected candidate', this.selectedCandidateDetails);
          // this.showMatchingParcentage = false;
        } else {
          this.hasApiError = true;
          this.selectedCandidateDetails = null;
        }
        this.loader = false;
      },
      error: (err) => {
        this.loader = false;
        this.hasApiError = true;
        this.selectedCandidateDetails = null;
        console.error("Error fetching candidate details:", err);
        // this.showMatchingParcentage = true;
      },
      // complete: () => {
      //   if (!this.hasApiError) {
      //     this.getInterviewTime(this.candidate.jobId, this.candidate.candidateId);
      //   }
      // }
      complete: () => {
        if (!this.hasApiError) {
          console.log("role", this.candidate.latestrole);
          this.getInterviewTime(
            this.candidate.jobId,
            this.candidate.candidateId
          );
          this.patchInterviewInfo(
            this.candidate.jobId,
            this.candidate.candidateId,
          );
        }
      },
    });
  }
  // getInterviewTime(JobId: any, CandidateId: any) {
  //   const Jsonobj = {
  //     jobId: JobId,
  //     CandidateId: CandidateId,
  //   };

  //   this.hiringManagerService.getcandidateInterviewtime(Jsonobj).subscribe(
  //     (data: any) => {
  //       if (data.isSuccess) {
  //         this.interviewTime = this.datepipe.transform(
  //           data?.result['0'].scheduledTime,
  //           'd MMMM yyyy'
  //         );
  //       }
  //     },
  //     () => { },
  //     () => {
  //       this.loader = false;
  //     }
  //   );
  // }

  getInterviewTime(JobId: any, CandidateId: any): void {
    const jsonObj = {
      jobId: JobId,
      CandidateId: CandidateId,
    };

    this.hiringManagerService.getcandidateInterviewtime(jsonObj).subscribe({
      next: (data: any) => {
        if (data.isSuccess) {
          this.interviewTime = this.datepipe.transform(
            data?.result["0"].scheduledTime,
            "d MMMM yyyy"
          );
        }
      },
      error: (err) => {
        console.error("Error fetching interview time:", err);
        //  this.showMatchingParcentage = true;
      },
      complete: () => {
        this.loader = false;
      },
    });
  }

  // getcandidateStatus(candidate: any) {
  //   this.hiringManagerService
  //     .candidateStatus(candidate.jobId, candidate.candidateId)
  //     .subscribe((res: any) => {
  //       if (res.isSuccess) {
  //         this.assessmentDetails = res.result?.sort((a: any, b: any) => {
  //           return a.assessmentSqnc - b.assessmentSqnc;
  //         });

  //         res.result.map((item: any) => {
  //           if (item.status === 'Pending') {
  //             this.component = item.assessmentName;
  //           }
  //         });
  //       }
  //     });
  // }

  getCandidateStatus(candidate: any): void {
    this.hiringManagerService
      .candidateStatus(candidate.jobId, candidate.candidateId)
      .subscribe({
        next: (res: any) => {
          if (res.isSuccess) {
            // Sort the assessment details by sequence
            this.assessmentDetails = res.result?.sort(
              (a: any, b: any) => a.assessmentSqnc - b.assessmentSqnc
            );

            // Find the component name of the pending assessment
            const pendingAssessment = res.result.find(
              (item: any) => item.status === "Pending"
            );

            if (pendingAssessment) {
              this.component = pendingAssessment.assessmentName;
            }
          }
        },
        error: (err) => {
          console.error("Error fetching candidate status:", err);
          this.showMatchingParcentage = true;
        },
        complete: () => {
          console.log("Candidate status fetch completed.");
        },
      });
  }

  

  closeModal() {
    this.close.emit("");
  }

  onReject() {
    let jobTitle = localStorage.getItem("jobTitle");
    let jobLocation = localStorage.getItem("jobLocation");
    let JObRole = localStorage.getItem("JObRole");
    const jasonBody = {
      jobId: this.candidate.jobId,
      candidateId: this.candidate.candidateId,
      status: "REJECTED",
      profileJourney: "SELECTION",
    };

    this.hiringManagerService.callProfileUpdateJurney(jasonBody).subscribe(
      (response: any) => {
        if (response.isSuccess) {
          console.log(response);
          this.jobSubscribe = this.hiringManagerService.jobSubscribe.next({
            id: this.candidate.jobId,
          });
        } else {
          console.error("Failed to update profile");
        }
      },
      (error) => {
        console.error("Error updating profile:", error);
      }
    );

    this.messageService.add({
      severity: "warn",
      detail: `Candidate ${this.selectedCandidateDetails?.first_name} Rejected`,
      summary: "Rejected",
      sticky: false,
    });

    let jsonObj = {
      to: [
        {
          name:
            this.selectedCandidateDetails?.first_name +
            " " +
            this.selectedCandidateDetails?.last_name,
          email: this.selectedCandidateDetails?.email,
        },
      ],
      subject: `Update on Your Application for ${jobTitle}`,
      plainTextBody: `Thank you for your interest in the ${jobTitle} position. We appreciate the time and effort you invested in your application and the opportunity to learn about your skills and experiences. 
                      After careful consideration, we have decided to move forward with other candidates who more closely match our current needs. Please know this decision was not easy due to the high quality of applicants.
                      We encourage you to apply for future openings for which you qualify, as we'd be happy to consider your application again.`,
      htmlBody: `<p>Hello ${
        this.selectedCandidateDetails?.first_name +
        " " +
        this.selectedCandidateDetails?.last_name
      },</p><p>Thank you for your interest in the <b>${jobTitle} </b> position. We appreciate the time and effort you invested in your <br/> application and the opportunity to learn about your skills and experiences.</p><br/><br/><br/>
<p>After careful consideration, we have decided to move forward with other candidates who more closely match our <br/>current needs. Please know this decision was not easy due to the high quality of applicants.</p></br></br></br><p>We encourage you to apply for future openings for which you qualify, as we'd be happy to consider your <br/>application again.</p><br/><br/>.</p><p>Best regards,<br>Hiring Platform</p>`,
    };
    this.sendMail_to_candidate(jsonObj);
    this.close.emit(
      this.selectedCandidateDetails?.first_name +
        " " +
        this.selectedCandidateDetails?.last_name +
        " has been Rejected_0"
    );
    // this.refresh.emit();
  }

  onApprove() {
    let jobTitle = localStorage.getItem("jobTitle");
    let jobLocation = localStorage.getItem("jobLocation");
    let JObRole = localStorage.getItem("JObRole");
    const jasonBody = {
      jobId: this.candidate.jobId,
      candidateId: this.candidate.candidateId,
      status: "SELECTED",
      profileJourney: "SELECTION",
    };

    this.hiringManagerService.callProfileUpdateJurney(jasonBody).subscribe(
      (response: any) => {
        if (response.isSuccess) {
          this.jobSubscribe = this.hiringManagerService.jobSubscribe.next({
            id: this.candidate.jobId,
          });
          console.log(response);
        } else {
          console.error("Failed to update profile");
        }
      },
      (error) => {
        console.error("Error updating profile:", error);
      }
    );
    this.messageService.add({
      severity: "success",
      detail: `Candidate ${this.selectedCandidateDetails?.first_name} Approved`,
      summary: "Approved",
      sticky: false,
    });

    let jsonObj = {
      to: [
        {
          name:
            this.selectedCandidateDetails?.first_name +
            " " +
            this.selectedCandidateDetails?.last_name,
          email: this.selectedCandidateDetails?.email,
        },
      ],
      subject: `Selected for ${JObRole} Position`,
      plainTextBody: `Congratulations! You have been selected for the ${jobTitle} position at ${jobLocation}. Please log in to the hiring platform for further details.`,
      htmlBody: `<p>Hello ${
        this.selectedCandidateDetails?.first_name +
        " " +
        this.selectedCandidateDetails?.last_name
      },</p><p>Congratulations! You have been selected for the  <b>  ${jobTitle} </b>. position at ${jobLocation}. Please log in to the hiring platform for further details.</p><p>Best regards,<br>Hiring Platform</p>`,
    };
    this.sendMail_to_candidate(jsonObj);
    this.close.emit(
      this.selectedCandidateDetails?.first_name +
        " " +
        this.selectedCandidateDetails?.last_name +
        " has been selected_1"
    );
    // this.refresh.emit();
  }

  getImagePath(assessmentName: string): string {
    return `public/assets/icons/${assessmentName}.svg`;
  }
  ngOnDestroy() {
    if (this.jobSubscribe) {
      this.jobSubscribe.unsubcribe();
    }
  }

  sendMail_to_candidate(Jsonobj: any) {
    this.hiringManagerService.sendNotification(Jsonobj).subscribe(
      (data) => {},
      () => {},
      () => {
        console.log("Completed");
      }
    );
  }

  getHiddenSkillsTooltip(candidate: any): string {
    if (candidate?.skills) {
      const allSkills = candidate.skills.split(",");
      const hiddenSkills = allSkills.slice(2);
      return hiddenSkills.join(", "); // Just join the skills with a comma
    }
    return "";
  }

  // Helper method to parse match percentage from string to number
  getMatchPercentageValue(): number {
    if (this.selectedCandidateDetails?.match_percentage) {
      // Remove the % symbol and convert to number
      const percentageString = this.selectedCandidateDetails.match_percentage
        .toString()
        .replace("%", "");
      return parseFloat(percentageString) || 0;
    }
    return 0;
  }

  // Helper method to get the display text for match percentage
  getMatchPercentageText(): string {
    if (this.selectedCandidateDetails?.match_percentage) {
      return this.selectedCandidateDetails.match_percentage;
    }
    return "0%";
  }

  // hasInterviewScheduled(): boolean {
  //   return this.assessmentDetails?.some(
  //     (a) =>
  //       (a.assessmentName === "Teams Interview" &&
  //         a.status === "Interview Scheduled") ||
  //       "Completed"
  //   );
  // }

  hasInterviewScheduled(): boolean {
    return this.assessmentDetails?.some(
      (a) =>
        a.assessmentName === "Teams Interview" &&
        (a.status === "Interview Scheduled" || a.status === "Completed")
    );
  }

  patchInterviewInfo(jobId: any, candidateId: any): void {
    this.isInterviewFormLoading = true;
    
    this.hiringManagerService.getInterviewInfo(jobId, candidateId).subscribe({
      next: (res: any) => {
        if (res?.isSuccess) {
          // Patch the data from the API
          this.interviewData.joinStatus = res.JoinStatus || "";
          this.interviewData.feedback = res.Feedback || "";
          this.interviewData.selectionStatus = res.SelectionStatus || "";
          
          // Enable editing only if API SelectionStatus is Under Review or empty
          const apiSel = this.interviewData.selectionStatus?.trim?.() ?? this.interviewData.selectionStatus;
          this.canEditBasedOnApi = apiSel === "Under Review" || apiSel === "";
          
          console.log("Interview info patched:", this.interviewData);
        } else {
          // No existing data: treat as empty selection -> allow editing
          this.canEditBasedOnApi = true;
          console.warn("No interview info found for this candidate.");
        }
        this.isInterviewFormLoading = false;
      },
      error: (err) => {
        // On error, allow editing (fallback to empty)
        this.canEditBasedOnApi = true;
        this.isInterviewFormLoading = false;
        console.error("Error fetching interview info:", err);
      },
    });
  }

  submitInterview() {
    // Form validation (conditional)
    if (!this.interviewData.joinStatus) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select Interview Joining Status',
      });
      return;
    }

    if (this.interviewData.joinStatus === 'Attend') {
      if (!this.interviewData.feedback || !this.interviewData.selectionStatus) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Validation Error',
          detail: 'Please provide feedback and selection status for attended interview',
        });
        return;
      }
    }

    this.isSubmittingInterview = true;
    this.button_enable = false;

    // Build payload conditionally
    const jsonBody: any = {
      jobId: this.candidate.jobId,
      candidateId: this.candidate.candidateId,
      joinStatus: this.interviewData.joinStatus,
      role: this.candidate.latestrole,
    };
    if (this.interviewData.joinStatus === 'Attend') {
      jsonBody.feedback = this.interviewData.feedback;
      jsonBody.selectionStatus = this.interviewData.selectionStatus;
    } else {
      jsonBody.feedback = '';
      jsonBody.selectionStatus = '';
    }

    this.hiringManagerService.submitInterviewInfo(jsonBody).subscribe({
      next: (res: any) => {
        this.isSubmittingInterview = false;
        
        if (res?.isSuccess) {
          this.messageService.add({
            severity: "success",
            summary: "Saved",
            detail: "Interview feedback submitted successfully",
          });

          // Refresh job data
          this.jobSubscribe = this.hiringManagerService.jobSubscribe.next({
            id: this.candidate.jobId,
          });

          // Close modal with success message
          this.close.emit(
            `${this.selectedCandidateDetails?.first_name ?? ""} ${
              this.selectedCandidateDetails?.last_name ?? ""
            } interview feedback saved`
          );
        } else {
          this.button_enable = true;
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: res?.message ?? "Failed to submit interview feedback",
          });
        }
      },
      error: (err) => {
        this.isSubmittingInterview = false;
        this.button_enable = true;
        console.error("submitInterview error", err);
        this.messageService.add({
          severity: "error",
          summary: "Server Error",
          detail: "Unable to submit interview feedback. Please try again.",
        });
      },
    });
  }

  // Helper method to check if interview form is valid
  isInterviewFormValid(): boolean {
    // If Not Attended -> only joinStatus is required
    if (this.interviewData.joinStatus === 'Not Attend') {
      return !!this.interviewData.joinStatus;
    }
    // If Attended -> all fields required
    if (this.interviewData.joinStatus === 'Attend') {
      return !!(this.interviewData.joinStatus && this.interviewData.feedback && this.interviewData.selectionStatus);
    }
    // Default: invalid until a joinStatus is chosen
    return false;
  }

  // Helper method to check if submit button should be enabled
  isSubmitButtonEnabled(): boolean {
    // Enable strictly based on API response allowance, plus form validity and not submitting
    return this.canEditBasedOnApi && this.isInterviewFormValid() && !this.isSubmittingInterview;
  }

  // Clear dependent fields when switching to Not Attend
  onJoinStatusChange(): void {
    if (this.interviewData.joinStatus === 'Not Attend') {
      this.interviewData.feedback = '';
      this.interviewData.selectionStatus = '';
    }
  }
}
