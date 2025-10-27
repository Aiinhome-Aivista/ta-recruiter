// let baseUrl =
//   'https://adani-hiring.southindia.cloudapp.azure.com/adani-hiring-hm-assessment/scenarioassessmentservice/';

let baseUrl = 'http://122.163.121.176:3008/'
let NotificationServices = 'http://122.163.121.176:3016';


export const POSTurls = {
  uploadCVs: baseUrl + 'RecruiterMicroservices/recruiter_upload_cv',
  loginRecruiter: baseUrl + 'RecruiterMicroservices/login/recruiter',
  candidateDetails: baseUrl + 'ProfileMicroservices/candidate/details',
  interviewSechudle: baseUrl + 'JobServices/getInterViewSechdule',
  callProfileUpdateJurney:
    baseUrl + 'AssessmentMicroservices/CallUpdateProfileJourneyStatus',
  notificationUrl: NotificationServices + '/api/NotificationService/sendMail',
  submitInterviewInfo: baseUrl + 'InterviewtMicroservices/submitInterviewInfo',
};

export const GETurls = {
  getShortlistedCandidates: (jobId: number) =>
    `${baseUrl}JobServices/ShortListed/${jobId}`,

  getJobDescriptionData: (jobId: number) =>
    `${baseUrl}JobServices/job_description/${jobId}`,
  getJobDetails: baseUrl + 'RecruiterMicroservices/GetJobDetais',
  searchHMByJobId: baseUrl + 'RecruiterMicroservices/getjobsearch',

  jobSearch: baseUrl + 'RecruiterMicroservices/jobsearch',
  candidateStatus:
    baseUrl + 'AssessmentMicroservices/JOB/CANDIDATE/ASSESSMENTSTATE/',
  getInterviewInfo: baseUrl + 'InterviewtMicroservices/getInterviewInfo/'
};

