// let baseUrl =
//   'https://adani-hiring.southindia.cloudapp.azure.com/adani-hiring-hm-assessment/scenarioassessmentservice/';

  let baseUrl = 'http://122.163.121.176:3008/'
  

export const POSTurls = {
  uploadCVs: baseUrl + 'RecruiterMicroservices/recruiter_upload_cv',
  loginRecruiter: baseUrl + 'RecruiterMicroservices/login/recruiter',
};

export const GETurls = {
  getShortlistedCandidates: (jobId: number) => 
    `${baseUrl}JobServices/ShortListed/${jobId}`,
  getJobDetails: baseUrl + 'RecruiterMicroservices/GetJobDetais',
  searchHMByJobId: baseUrl + 'RecruiterMicroservices/getjobsearch',
};

