import { Donor, DonationRecord, BloodRequest, InventoryItem } from './types';

export const DONORS: Donor[] = [
  { id: '1', name: 'Julianne Smith', group: 'O+', age: 29, gender: 'Female', lastDonation: 'Oct 12, 2023', type: 'Whole Blood', status: 'Eligible' },
  { id: '2', name: 'Marcus Rodriguez', group: 'AB-', age: 42, gender: 'Male', lastDonation: 'Jan 04, 2024', type: 'Platelets', status: 'Cooling Period', daysLeft: 22 },
  { id: '3', name: 'Elena Lund', group: 'O-', age: 31, gender: 'Female', lastDonation: 'Nov 22, 2023', type: 'Whole Blood', status: 'Eligible' },
  { id: '4', name: 'James D\'Angelo', group: 'A+', age: 35, gender: 'Male', lastDonation: 'Oct 12, 2023', type: 'Whole Blood', status: 'Eligible' },
  { id: '5', name: 'Linda Wu', group: 'B-', age: 28, gender: 'Female', lastDonation: 'Oct 11, 2023', type: 'Whole Blood', status: 'Eligible' },
];

export const DONATION_RECORDS: DonationRecord[] = [
  { id: 'DX-9021', donorName: 'Elena Rodriguez', group: 'O+', units: 450, date: 'Oct 24, 2023 • 09:15 AM', status: 'Completed' },
  { id: 'DX-8842', donorName: 'Julian Blackwood', group: 'A-', units: 500, date: 'Oct 24, 2023 • 11:40 AM', status: 'Processing' },
  { id: 'DX-8731', donorName: 'Sarah Mitchell', group: 'B+', units: 450, date: 'Oct 23, 2023 • 04:22 PM', status: 'Cancelled' },
  { id: 'DX-8669', donorName: 'Marcus Chen', group: 'O-', units: 500, date: 'Oct 23, 2023 • 01:10 PM', status: 'Completed' },
];

export const BLOOD_REQUESTS: BloodRequest[] = [
  { id: '77291-SJ', hospital: 'St. Jude General Hospital', group: 'O-', units: 5, priority: 'Emergency', status: 'Pending' },
  { id: '77290-CT', hospital: 'City Trauma Center', group: 'A+', units: 12, priority: 'Normal', status: 'Approved', eta: '20m' },
  { id: '77288-NP', hospital: 'North Hills Pediatrics', group: 'B+', units: 2, priority: 'Normal', status: 'Fulfilled' },
];

export const INVENTORY: InventoryItem[] = [
  { group: 'O-', units: 42, capacity: 500, status: 'Critical', lastUpdated: '14 mins ago', source: 'Donor Portal' },
  { group: 'A+', units: 842, capacity: 1000, status: 'Available', lastUpdated: '2 hours ago', source: 'Manual Audit' },
  { group: 'B-', units: 112, capacity: 400, status: 'Low Stock', lastUpdated: 'Yesterday', source: 'Hospital Transfer' },
  { group: 'A-', units: 14, capacity: 100, status: 'Low Stock', lastUpdated: '3 hours ago', source: 'Manual Audit' },
  { group: 'B+', units: 65, capacity: 200, status: 'Available', lastUpdated: '5 hours ago', source: 'Manual Audit' },
  { group: 'AB+', units: 22, capacity: 100, status: 'Available', lastUpdated: '1 day ago', source: 'Manual Audit' },
  { group: 'AB-', units: 8, capacity: 50, status: 'Critical', lastUpdated: '2 days ago', source: 'Manual Audit' },
  { group: 'O+', units: 120, capacity: 200, status: 'Available', lastUpdated: '1 hour ago', source: 'Manual Audit' },
];
