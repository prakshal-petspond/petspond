import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export type IonName = ComponentProps<typeof Ionicons>['name'];

export interface VetDoctor {
  id: string;
  name: string;
  title: string;
  experience: string;
  image: string;
}

export interface VetServiceItem {
  id: string;
  name: string;
  icon: IonName;
}

export interface VetListItem {
  id: string;
  name: string;
  clinic: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  distance: string;
  status: 'Open' | 'Closed';
  closingTime: string;
  image: string;
  is24_7: boolean;
}

export interface VetDetail extends VetListItem {
  tagline: string;
  address: string;
  heroImage: string;
  staffDoctorsCount: number;
  establishedYear: number;
  photos: string[];
  facilities: string[];
  hours: { day: string; hours: string }[];
  services: VetServiceItem[];
  doctors: VetDoctor[];
}

const PH = 'https://images.unsplash.com';

export const VET_DETAILS: Record<string, VetDetail> = {
  '1': {
    id: '1',
    name: 'Dr. Sarah Johnson',
    clinic: 'PetCare Veterinary Clinic',
    specialty: 'General Practice',
    tagline: 'Complete Pet Healthcare Solutions',
    rating: 4.9,
    reviewCount: 1247,
    distance: '0.8 kms',
    status: 'Open',
    closingTime: '8:00 PM',
    image: `${PH}/photo-1612349317150-e413f6d5a925?w=200&h=200&fit=crop`,
    heroImage: `${PH}/photo-1513245543132-31f507179bca?w=800&h=480&fit=crop`,
    is24_7: false,
    address: '123 Pet Street, Vasundhara Sector 5, Ghaziabad, UP 201012',
    staffDoctorsCount: 8,
    establishedYear: 2015,
    photos: [
      `${PH}/photo-1628009368232-7b4a0e60a478?w=400&h=300&fit=crop`,
      `${PH}/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop`,
      `${PH}/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop`,
      `${PH}/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop`,
      `${PH}/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop`,
      `${PH}/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop`,
    ],
    facilities: [
      'Advanced Diagnostic Lab',
      '24/7 Emergency Care',
      'Surgery Theater',
      'Pet Pharmacy',
      'Grooming Services',
      'Pet Boarding',
      'X-Ray & Ultrasound',
      'In-house Laboratory',
    ],
    hours: [
      { day: 'Mon - Fri', hours: '9:00 AM - 8:00 PM' },
      { day: 'Saturday', hours: '10:00 AM - 6:00 PM' },
      { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
    ],
    services: [
      { id: 'checkup', name: 'General Checkup', icon: 'medical' },
      { id: 'vax', name: 'Vaccination', icon: 'bandage' },
      { id: 'groom', name: 'Grooming', icon: 'brush' },
      { id: 'surgery', name: 'Surgery', icon: 'fitness' },
      { id: 'dental', name: 'Dental', icon: 'happy' },
      { id: 'emergency', name: 'Emergency', icon: 'warning' },
    ],
    doctors: [
      {
        id: 'd1',
        name: 'Dr. Rajesh Kumar',
        title: 'General Physician',
        experience: '10+ years experience',
        image: `${PH}/photo-1612349317150-e413f6d5a925?w=120&h=120&fit=crop`,
      },
      {
        id: 'd2',
        name: 'Dr. Anita Sharma',
        title: 'Surgeon',
        experience: '8+ years experience',
        image: `${PH}/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop`,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Dr. Michael Chen',
    clinic: 'Advanced Pet Hospital',
    specialty: 'Surgery & Emergency',
    tagline: 'Critical care when it matters most',
    rating: 4.8,
    reviewCount: 512,
    distance: '1.2 kms',
    status: 'Open',
    closingTime: 'Open 24/7',
    image: `${PH}/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop`,
    heroImage: `${PH}/photo-1576091160550-2173dba999ef?w=800&h=480&fit=crop`,
    is24_7: true,
    address: '88 Emergency Lane, Indirapuram, Ghaziabad, UP 201014',
    staffDoctorsCount: 12,
    establishedYear: 2012,
    photos: [
      `${PH}/photo-1576201836106-db1758fd1c97?w=400&h=300&fit=crop`,
      `${PH}/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop`,
    ],
    facilities: ['ICU', 'Emergency Ward', 'Surgery Theater', 'Diagnostic Imaging', 'Blood Bank', 'Pharmacy'],
    hours: [
      { day: 'Every day', hours: 'Open 24 hours' },
    ],
    services: [
      { id: 'emergency', name: 'Emergency', icon: 'warning' },
      { id: 'surgery', name: 'Surgery', icon: 'fitness' },
      { id: 'checkup', name: 'General Checkup', icon: 'medical' },
    ],
    doctors: [
      {
        id: 'd1',
        name: 'Dr. Michael Chen',
        title: 'Emergency & Surgery',
        experience: '15+ years experience',
        image: `${PH}/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop`,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    clinic: 'Happy Tails Veterinary Center',
    tagline: 'Dental & skin care specialists',
    specialty: 'Dental & Dermatology',
    rating: 4.7,
    reviewCount: 289,
    distance: '1.8 kms',
    status: 'Open',
    closingTime: '7:00 PM',
    image: `${PH}/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop`,
    heroImage: `${PH}/photo-1548199973-03cce0bbc87b?w=800&h=480&fit=crop`,
    is24_7: false,
    address: '45 Tails Avenue, Kaushambi, Ghaziabad, UP 201010',
    staffDoctorsCount: 5,
    establishedYear: 2018,
    photos: [
      `${PH}/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop`,
      `${PH}/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop`,
    ],
    facilities: ['Dental Suite', 'Dermatology Lab', 'Grooming', 'Pharmacy'],
    hours: [
      { day: 'Mon - Sat', hours: '9:00 AM - 7:00 PM' },
      { day: 'Sunday', hours: 'Closed' },
    ],
    services: [
      { id: 'dental', name: 'Dental', icon: 'happy' },
      { id: 'checkup', name: 'General Checkup', icon: 'medical' },
      { id: 'groom', name: 'Grooming', icon: 'brush' },
    ],
    doctors: [
      {
        id: 'd1',
        name: 'Dr. Emily Rodriguez',
        title: 'Dental & Dermatology',
        experience: '9+ years experience',
        image: `${PH}/photo-1587300003388-59208cc962cb?w=120&h=120&fit=crop`,
      },
    ],
  },
  '4': {
    id: '4',
    name: 'Dr. James Wilson',
    clinic: 'Compassionate Care Vets',
    tagline: 'Family-focused veterinary care',
    specialty: 'General Practice',
    rating: 4.6,
    reviewCount: 198,
    distance: '2.1 kms',
    status: 'Open',
    closingTime: '6:30 PM',
    image: `${PH}/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop`,
    heroImage: `${PH}/photo-1583337130417-3346a1be7dee?w=800&h=480&fit=crop`,
    is24_7: false,
    address: '200 Care Street, Raj Nagar Extension, Ghaziabad, UP 201017',
    staffDoctorsCount: 4,
    establishedYear: 2016,
    photos: [
      `${PH}/photo-1628009368232-7b4a0e60a478?w=400&h=300&fit=crop`,
    ],
    facilities: ['Consultation', 'Lab', 'Pharmacy', 'Vaccination'],
    hours: [
      { day: 'Mon - Fri', hours: '8:30 AM - 6:30 PM' },
      { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
      { day: 'Sunday', hours: 'Closed' },
    ],
    services: [
      { id: 'checkup', name: 'General Checkup', icon: 'medical' },
      { id: 'vax', name: 'Vaccination', icon: 'bandage' },
    ],
    doctors: [
      {
        id: 'd1',
        name: 'Dr. James Wilson',
        title: 'General Practice',
        experience: '7+ years experience',
        image: `${PH}/photo-1576091160399-112ba8d25d1d?w=120&h=120&fit=crop`,
      },
    ],
  },
};

function toListItem(d: VetDetail): VetListItem {
  return {
    id: d.id,
    name: d.name,
    clinic: d.clinic,
    specialty: d.specialty,
    rating: d.rating,
    reviewCount: d.reviewCount,
    distance: d.distance,
    status: d.status,
    closingTime: d.closingTime,
    image: d.image,
    is24_7: d.is24_7,
  };
}

export const VETS_LIST: VetListItem[] = Object.values(VET_DETAILS).map(toListItem);

export function getVetDetail(id: string): VetDetail | undefined {
  return VET_DETAILS[id];
}
