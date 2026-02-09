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

// ----- Vet -----
export interface Vet {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  veterinaryRegistrationNumber: string;
  yearOfRegistration: number;
  qualifications: string[];
  specializations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVetDto {
  fullName: string;
  mobile: string;
  email: string;
  veterinaryRegistrationNumber: string;
  yearOfRegistration: number;
  qualifications: string[];
  specializations: string[];
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
