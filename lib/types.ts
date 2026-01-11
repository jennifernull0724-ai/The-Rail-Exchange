export type JobUrgency = 'urgent' | 'scheduled';

export interface JobLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface JobRequest {
  id: string;
  ownerCompanyId: string;
  title: string;
  description: string;
  jobType: string;
  commodity: string;
  scope: string;
  urgency: JobUrgency;
  startDate?: string;
  location: JobLocation;
  complianceRequirements: string[];
  equipmentNotes?: string;
  laborNotes?: string;
  pricingExpectation?: string;
  photos: string[];
  documents: string[];
  status: 'open' | 'closed';
}

export interface OpenJobRequestLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

export interface OpenJobRequest {
  id: string;
  ownerCompanyId: string;
  companyName: string;
  title: string;
  jobType: string;
  commodity: string;
  urgency: JobUrgency;
  location: OpenJobRequestLocation;
  scopeSummary: string;
  photoCount: number;
  complianceRequirements: string[];
  postedAt: string;
  status: 'open';
}
