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
    // console.log('Hello World', this.candidate);

    // Extract active tab information
    if (this.candidate && this.candidate.activeTab) {
      this.activeTab = this.candidate.activeTab;
      console.log("Active Tab:", this.activeTab);
    }

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
      jobId: this.candidate.jobId
    };
    this.recruiterService.CandidateDetails(jsonBody).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          this.selectedCandidateDetails = res.result;
          this.hasApiError = false;
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
      },
    });
  }
  

  closeModal() {
    this.close.emit("");
  }


  getImagePath(assessmentName: string): string {
    return `public/assets/icons/${assessmentName}.svg`;
  }
  ngOnDestroy() {
    if (this.jobSubscribe) {
      this.jobSubscribe.unsubcribe();
    }
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
}
