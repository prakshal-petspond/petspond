/**
 * Shared types and DTOs for Petspond platform.
 * Used by API, api-client, and frontends for type safety.
 */

// ----- User (Pet Parent) -----
export interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  pincode?: string;
  referredBy?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  pincode?: string;
  referredBy?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  city?: string;
  pincode?: string;
  onboardingCompleted?: boolean;
}

// Complete onboarding request (name required when completing)
export interface CompleteOnboardingDto {
  name: string;
  email?: string;
  city?: string;
  pincode?: string;
}

// ----- Vet -----
export type VetApprovalStatus = 'pending' | 'approved';

export const VET_QUALIFICATIONS = [
  'BVSc',
  'MVSc',
  'PhD',
  'DVSc',
  'B.V.Sc. & A.H.',
  'M.V.Sc.',
  'Other',
] as const;
export type VetQualification = (typeof VET_QUALIFICATIONS)[number];

export const VET_SPECIALIZATIONS = [
  'Small animals',
  'Surgery',
  'Dermatology',
  'Nutrition',
  'Exotic pets',
  'Large animals',
  'Internal medicine',
  'Preventive care',
  'Other',
] as const;
export type VetSpecialization = (typeof VET_SPECIALIZATIONS)[number];

export interface Vet {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  veterinaryRegistrationNumber: string;
  yearOfRegistration: number;
  qualifications: string[];
  specializations: string[];
  clinicId?: string;
  isClinicAdmin: boolean;
  approvalStatus: VetApprovalStatus;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVetDto {
  fullName: string;
  mobile: string;
  email?: string;
  veterinaryRegistrationNumber: string;
  yearOfRegistration: number;
  qualifications: string[];
  specializations: string[];
}

export interface VetCompleteOnboardingDto {
  fullName: string;
  email?: string;
  veterinaryRegistrationNumber: string;
  yearOfRegistration: number;
  qualifications: string[];
  specializations: string[];
  /** Existing clinic to join (doctor will need approval from admin) */
  clinicId?: string;
  /** Or create new clinic (doctor becomes admin) */
  newClinic?: CreateClinicDto;
}

// ----- Clinic -----
export interface Clinic {
  id: string;
  name: string;
  totalDoctors: number;
  address: string;
  pincode: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  adminVetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicDto {
  name: string;
  totalDoctors: number;
  address: string;
  pincode: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface VetVerifyOtpResponse {
  verified: boolean;
  token?: string;
  vet?: Vet;
  message?: string;
}

// ----- Pet -----
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'other';
export type PetGender = 'male' | 'female' | 'other';
export type ServiceNeeded = 'grooming' | 'walking' | 'nutrition' | 'veterinary';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  dateOfBirth?: string;
  gender?: PetGender;
  servicesNeeded: ServiceNeeded[];
  weight?: number;
  neutered?: boolean;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePetDto {
  name: string;
  species: PetSpecies;
  breed: string;
  dateOfBirth?: string;
  gender?: PetGender;
  servicesNeeded: ServiceNeeded[];
  weight?: number;
  neutered?: boolean;
  photoUrl?: string;
}

export interface UpdatePetDto extends Partial<CreatePetDto> {}

// ----- Appointment -----
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  userId: string;
  vetId: string;
  petId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----- Auth / OTP -----
export interface SendOtpDto {
  mobile: string;
  /** Optional country code (e.g. "91" for India). Server uses default if omitted. */
  countryCode?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
}

export interface VerifyOtpDto {
  mobile: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// ----- Common -----
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
