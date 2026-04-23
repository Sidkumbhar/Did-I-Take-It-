import { Medication } from './types';

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Metformin',
    dosage: '500mg',
    frequency: '2x Daily, W/ Meals',
    nextDose: 'Today, 6:30 PM',
    status: 'active',
    adherence: 85,
    type: 'capsule',
    color: '#006d36',
    schedule: [
      { time: '8:00 AM', status: 'taken', loggedTime: '8:05 AM' },
      { time: '6:30 PM', status: 'upcoming' }
    ]
  },
  {
    id: '2',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: '1x Daily, Morning',
    nextDose: 'Tomorrow, 8:00 AM',
    status: 'active',
    adherence: 100,
    type: 'pill',
    color: '#005da7',
    schedule: [
      { time: '9:00 AM', status: 'taken', loggedTime: '9:12 AM' }
    ]
  },
];
