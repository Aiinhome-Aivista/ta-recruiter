let baseUrl =
  'https://adani-hiring.southindia.cloudapp.azure.com/adani-hiring-hm-assessment/scenarioassessmentservice/';

export const POSTurls = {
  uploadCVs: baseUrl + 'UploadCandidateCVs',
};

export const GETurls = {
  getShortlistedCandidates: baseUrl + 'GetShortlistedCandidates',
  getJobDetails: baseUrl + 'GetJobDetais',
  searchHMByJobId: baseUrl + 'SearchHMByJobId',
};
