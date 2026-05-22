export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Donor {
  id: string;
  name: string;
  group: BloodGroup;
  age: number;
  gender: 'Male' | 'Female';
  lastDonation: string;
  type: 'Whole Blood' | 'Platelets' | 'Plasma';
  status: 'Eligible' | 'Cooling Period';
  daysLeft?: number;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  group: BloodGroup;
  units: number;
  date: string;
  status: 'Completed' | 'Processing' | 'Cancelled';
}

export interface BloodRequest {
  id: string;
  hospital: string;
  group: BloodGroup;
  units: number;
  priority: 'Emergency' | 'Normal';
  status: 'Pending' | 'Approved' | 'Dispatched' | 'Fulfilled';
  eta?: string;
}

export interface InventoryItem {
  group: BloodGroup;
  units: number;
  capacity: number;
  status: 'Critical' | 'Low Stock' | 'Available';
  lastUpdated: string;
  source: string;
}
