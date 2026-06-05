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

/** Areas of expertise shown in vet-crm team onboarding (step 3). */
export const VET_EXPERTISE_AREAS = [
  'General Practice',
  'Surgery',
  'Internal Medicine',
  'Dentistry',
  'Dermatology',
  'Cardiology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Emergency Care',
  'Exotic Animals',
  'Neurology',
] as const;
export type VetExpertiseArea = (typeof VET_EXPERTISE_AREAS)[number];

export type ClinicStaffRole = 'front_office' | 'veterinarian';

export interface ClinicStaffMember {
  id: string;
  clinicId: string;
  role: ClinicStaffRole;
  fullName: string;
  email?: string;
  mobile?: string;
  veterinaryRegistrationNumber?: string;
  specializations: string[];
  linkedVetId?: string;
  createdByVetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTeamVetInput {
  fullName: string;
  email?: string;
  mobile?: string;
  veterinaryRegistrationNumber?: string;
  specializations?: string[];
}

export interface OnboardingFrontStaffInput {
  fullName: string;
  email?: string;
  mobile?: string;
}

export interface VetCompleteClinicSetupDto {
  fullName: string;
  clinicName: string;
  phone: string;
  email?: string;
  address: string;
  pincode: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  weeklyAvailability: VetWeeklyAvailabilityBlock[];
  servicesOffered: ClinicServiceItem[];
  additionalVeterinarians?: OnboardingTeamVetInput[];
  frontOfficeStaff?: OnboardingFrontStaffInput[];
}

export interface ClinicTeamResponse {
  veterinarians: Vet[];
  frontOfficeStaff: ClinicStaffMember[];
  pendingVeterinarians: ClinicStaffMember[];
}

export interface VetWeeklyAvailabilityBlock {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

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
  photoUrl?: string;
  displayTitle?: string;
  /** When empty, pet parent app uses default bookable slots for that clinic. */
  weeklyAvailability: VetWeeklyAvailabilityBlock[];
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
  photoUrl?: string;
  displayTitle?: string;
}

// ----- Clinic -----
export interface ClinicServiceItem {
  id: string;
  name: string;
  icon: string;
}

export interface ClinicVaccineOffering {
  id: string;
  name: string;
  pricePaise: number;
}

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
  listingImage?: string;
  heroImage?: string;
  tagline?: string;
  rating: number;
  reviewCount: number;
  is24_7: boolean;
  closingTimeLabel?: string;
  hours: { day: string; hours: string }[];
  facilities: string[];
  photoGallery: string[];
  servicesOffered: ClinicServiceItem[];
  vaccinesOffered: ClinicVaccineOffering[];
  acceptsConsultations: boolean;
  acceptsVaccinations: boolean;
  establishedYear?: number;
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
  tagline?: string;
  listingImage?: string;
  heroImage?: string;
  acceptsConsultations?: boolean;
  acceptsVaccinations?: boolean;
}

export interface UpdateClinicDto {
  name?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  tagline?: string;
  listingImage?: string;
  heroImage?: string;
  rating?: number;
  reviewCount?: number;
  is24_7?: boolean;
  closingTimeLabel?: string;
  hours?: { day: string; hours: string }[];
  facilities?: string[];
  photoGallery?: string[];
  servicesOffered?: ClinicServiceItem[];
  vaccinesOffered?: ClinicVaccineOffering[];
  acceptsConsultations?: boolean;
  acceptsVaccinations?: boolean;
  establishedYear?: number;
}

export interface PublicClinicDoctorPreview {
  id: string;
  fullName: string;
  specializations: string[];
  photoUrl?: string;
  displayTitle?: string;
  weeklyAvailability?: VetWeeklyAvailabilityBlock[];
}

export interface PublicClinicListItem {
  id: string;
  name: string;
  address: string;
  pincode: string;
  city?: string;
  /** WGS84 — set from Vet CRM clinic profile for distance / maps */
  latitude?: number;
  longitude?: number;
  primaryDoctor: PublicClinicDoctorPreview;
  rating: number;
  reviewCount: number;
  distanceLabel?: string;
  is24_7: boolean;
  closingTimeLabel?: string;
  vaccinesOffered: ClinicVaccineOffering[];
  lowestVaccinationPricePaise?: number;
  acceptsConsultations: boolean;
  acceptsVaccinations: boolean;
}

export interface PublicClinicDetail extends PublicClinicListItem {
  tagline?: string;
  listingImage?: string;
  heroImage?: string;
  photoGallery: string[];
  facilities: string[];
  hours: { day: string; hours: string }[];
  servicesOffered: ClinicServiceItem[];
  totalDoctors: number;
  establishedYear?: number;
  doctors: PublicClinicDoctorPreview[];
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
  microchipId?: string;
  medicalNotes?: string;
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
  microchipId?: string;
  medicalNotes?: string;
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

export type ConsultationBookingStatus =
  | 'pending_payment'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type BookingPaymentStatus = 'pending' | 'paid' | 'failed';

export interface ConsultationBooking {
  id: string;
  userId: string;
  clinicId: string;
  vetId: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petWeightLabel?: string;
  reasonIds: string[];
  notes?: string;
  scheduledAt: string;
  status: ConsultationBookingStatus;
  paymentStatus: BookingPaymentStatus;
  consultationFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  promoCode?: string;
  paymentMethodLabel?: string;
  stripeCheckoutSessionId?: string;
  userName?: string;
  userMobile?: string;
  clinicName?: string;
  vetName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationBookingDto {
  clinicId: string;
  vetId: string;
  petId: string;
  reasonIds: string[];
  notes?: string;
  scheduledAt: string;
  promoCode?: string;
  paymentMethodLabel?: string;
  discountPaise?: number;
}

export type VaccinationBookingStatus =
  | 'pending_payment'
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface VaccinationLineItem {
  vaccineId: string;
  name: string;
  pricePaise: number;
}

export interface VaccinationBooking {
  id: string;
  userId: string;
  clinicId: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  vaccines: VaccinationLineItem[];
  notes?: string;
  scheduledAt: string;
  status: VaccinationBookingStatus;
  paymentStatus: BookingPaymentStatus;
  platformFeePaise: number;
  discountPaise: number;
  vaccinesSubtotalPaise: number;
  totalPaise: number;
  promoCode?: string;
  paymentMethodLabel?: string;
  stripeCheckoutSessionId?: string;
  userName?: string;
  userMobile?: string;
  clinicName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaccinationBookingDto {
  clinicId: string;
  petId: string;
  vaccineIds: string[];
  notes?: string;
  scheduledAt: string;
  promoCode?: string;
  paymentMethodLabel?: string;
  discountPaise?: number;
}

export interface ClinicInviteDto {
  id: string;
  clinicId: string;
  mobile: string;
  createdAt: string;
  createdByVetId: string;
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

// ----- Vendor (walkers, trainers, groomers) -----
export type VendorServiceType = 'grooming' | 'training' | 'walking';
export type VendorServiceMode = 'on_site' | 'doorstep';

export interface VendorWeeklyAvailabilityBlock {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface Vendor {
  id: string;
  mobile: string;
  businessName: string;
  displayTitle?: string;
  bio?: string;
  photoUrl?: string;
  serviceTypes: VendorServiceType[];
  serviceModes: VendorServiceMode[];
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  serviceRadiusKm: number;
  weeklyAvailability: VendorWeeklyAvailabilityBlock[];
  rating: number;
  reviewCount: number;
  promo?: string;
  onboardingCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorVerifyOtpResponse {
  verified: boolean;
  token?: string;
  vendor?: Vendor;
  message?: string;
}

export interface VendorCompleteOnboardingDto {
  businessName: string;
  displayTitle?: string;
  bio?: string;
  photoUrl?: string;
  serviceTypes: VendorServiceType[];
  serviceModes: VendorServiceMode[];
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  serviceRadiusKm: number;
  weeklyAvailability: VendorWeeklyAvailabilityBlock[];
  promo?: string;
}

export interface VendorUpdateProfileDto {
  businessName?: string;
  displayTitle?: string;
  bio?: string;
  photoUrl?: string;
  serviceTypes?: VendorServiceType[];
  serviceModes?: VendorServiceMode[];
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  serviceRadiusKm?: number;
  weeklyAvailability?: VendorWeeklyAvailabilityBlock[];
  promo?: string;
  isActive?: boolean;
}

export interface PublicVendorListItem {
  id: string;
  businessName: string;
  displayTitle?: string;
  photoUrl?: string;
  serviceTypes: VendorServiceType[];
  serviceModes: VendorServiceMode[];
  rating: number;
  reviewCount: number;
  distanceKm?: number;
  promo?: string;
  image?: string;
}

export interface PublicVendorDetail extends PublicVendorListItem {
  bio?: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  weeklyAvailability: VendorWeeklyAvailabilityBlock[];
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
