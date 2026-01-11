export type JobDetailViewModel = {
  id: string;
  title: string;
  companyName: string;
  urgency: 'urgent' | 'scheduled';
  status: 'open' | 'closed';
  postedDateLabel: string;

  jobType: string;
  commodity: string;
  volumeLabel: string;
  distanceLabel?: string;

  addressLine: string;
  cityStateLine: string;
  facilityNameLabel: string;
  gateInstructionsLabel: string;
  ppeRequirementsLabel: string;
  clearanceNotesLabel: string;
  railAccessNotesLabel: string;

  scopeFull: string;
  equipmentNotesLabel: string;
  laborNotesLabel: string;

  complianceRequired: string[];
  complianceOptional: string[];

  startDateLabel: string;
  durationLabel: string;
  workHoursLabel: string;

  pricingExpectationLabel: string;
  pricingNotesLabel: string;

  photos: Array<{ src: string; alt: string }>;

  isOwner: boolean;
  role: 'contractor' | 'logistics_company';
};
