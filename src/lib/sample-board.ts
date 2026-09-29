import type { BoardCard } from './crm-types';

const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();

export const sampleBoard: BoardCard[] = [
  {
    id: 's1', stage: 'appointment_set', owner: 'Case manager',
    qualified: true, ready: true, score: 92,
    lastContactAt: hoursAgo(6), createdAt: hoursAgo(120), attempts: 2,
    archiveReason: null,
    applicant: { name: "Amara Okafor", phone: "908-555-0142", email: "amara.okafor@example.com", source: "CareerPlug" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
  {
    id: 's2', stage: 'with_coordinator', owner: 'Coordinator',
    qualified: true, ready: true, score: 85,
    lastContactAt: hoursAgo(20), createdAt: hoursAgo(120), attempts: 1,
    archiveReason: null,
    applicant: { name: "Denise Whitfield", phone: "973-555-0188", email: "d.whitfield@example.com", source: "CareerPlug" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
  {
    id: 's3', stage: 'ready', owner: 'Case manager',
    qualified: true, ready: true, score: 88,
    lastContactAt: hoursAgo(30), createdAt: hoursAgo(120), attempts: 2,
    archiveReason: null,
    applicant: { name: "Rosa Delgado", phone: "732-555-0164", email: "rosa.delgado@example.com", source: "Indeed" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
  {
    id: 's4', stage: 'screening', owner: 'HR',
    qualified: false, ready: false, score: null,
    lastContactAt: hoursAgo(70), createdAt: hoursAgo(120), attempts: 1,
    archiveReason: null,
    applicant: { name: "Marcus Bell", phone: "862-555-0119", email: "marcus.bell@example.com", source: "CareerPlug" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
  {
    id: 's5', stage: 'new', owner: null,
    qualified: false, ready: false, score: null,
    lastContactAt: null, createdAt: hoursAgo(120), attempts: 0,
    archiveReason: null,
    applicant: { name: "Tunde Adeyemi", phone: "201-555-0173", email: "t.adeyemi@example.com", source: "CareerPlug" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
  {
    id: 's6', stage: 'new', owner: null,
    qualified: false, ready: false, score: null,
    lastContactAt: null, createdAt: hoursAgo(120), attempts: 0,
    archiveReason: null,
    applicant: { name: "Jasmine Carter", phone: "908-555-0155", email: "jasmine.c@example.com", source: "CareerPlug" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
  {
    id: 's7', stage: 'archived', owner: null,
    qualified: false, ready: false, score: null,
    lastContactAt: hoursAgo(96), createdAt: hoursAgo(120), attempts: 3,
    archiveReason: 'Unresponsive after 3 attempts',
    applicant: { name: "Priya Raman", phone: "609-555-0131", email: "priya.raman@example.com", source: "Referral" },
    position: { title: 'Direct Support Professional (DSP)', location: 'Washington, NJ' },
  },
];
