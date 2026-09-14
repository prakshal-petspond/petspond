-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "referredBy" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vet" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "veterinaryRegistrationNumber" TEXT NOT NULL,
    "yearOfRegistration" INTEGER NOT NULL,
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinicId" TEXT,
    "isClinicAdmin" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "displayTitle" TEXT,
    "weeklyAvailability" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalDoctors" INTEGER NOT NULL DEFAULT 1,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "placeId" TEXT,
    "adminVetId" TEXT NOT NULL,
    "listingImage" TEXT,
    "heroImage" TEXT,
    "tagline" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "is24_7" BOOLEAN NOT NULL DEFAULT false,
    "closingTimeLabel" TEXT,
    "hours" JSONB NOT NULL DEFAULT '[]',
    "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoGallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "servicesOffered" JSONB NOT NULL DEFAULT '[]',
    "vaccinesOffered" JSONB NOT NULL DEFAULT '[]',
    "acceptsConsultations" BOOLEAN NOT NULL DEFAULT true,
    "acceptsVaccinations" BOOLEAN NOT NULL DEFAULT true,
    "establishedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicStaff" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'front_office',
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "createdByVetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "servicesNeeded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weight" DOUBLE PRECISION,
    "neutered" BOOLEAN,
    "photoUrl" TEXT,
    "microchipId" TEXT,
    "medicalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT '',
    "displayTitle" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "serviceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT,
    "serviceRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "weeklyAvailability" JSONB NOT NULL DEFAULT '[]',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "promo" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clinicId" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "petId" TEXT,
    "petName" TEXT NOT NULL,
    "petSpecies" TEXT NOT NULL,
    "petBreed" TEXT NOT NULL,
    "petWeightLabel" TEXT,
    "reasonIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "queueStatus" TEXT NOT NULL DEFAULT 'expected',
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "ownerNameSnapshot" TEXT,
    "ownerMobileSnapshot" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "consultationStartedAt" TIMESTAMP(3),
    "checkoutReadyAt" TIMESTAMP(3),
    "roomLabel" TEXT,
    "invoiceNumber" TEXT,
    "collectedAt" TIMESTAMP(3),
    "collectedByVetId" TEXT,
    "refundedAt" TIMESTAMP(3),
    "consultationFeePaise" INTEGER NOT NULL,
    "platformFeePaise" INTEGER NOT NULL,
    "discountPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL,
    "promoCode" TEXT,
    "paymentMethodLabel" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccinationBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "petSpecies" TEXT NOT NULL,
    "petBreed" TEXT NOT NULL,
    "vaccines" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "platformFeePaise" INTEGER NOT NULL,
    "discountPaise" INTEGER NOT NULL DEFAULT 0,
    "vaccinesSubtotalPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "promoCode" TEXT,
    "paymentMethodLabel" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccinationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicInvite" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "createdByVetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetRefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VetRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "User_mobile_idx" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Vet_mobile_key" ON "Vet"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Vet_email_key" ON "Vet"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vet_googleId_key" ON "Vet"("googleId");

-- CreateIndex
CREATE INDEX "Vet_clinicId_idx" ON "Vet"("clinicId");

-- CreateIndex
CREATE INDEX "Vet_email_idx" ON "Vet"("email");

-- CreateIndex
CREATE INDEX "Vet_googleId_idx" ON "Vet"("googleId");

-- CreateIndex
CREATE INDEX "Clinic_adminVetId_idx" ON "Clinic"("adminVetId");

-- CreateIndex
CREATE INDEX "Clinic_pincode_idx" ON "Clinic"("pincode");

-- CreateIndex
CREATE INDEX "ClinicStaff_clinicId_role_idx" ON "ClinicStaff"("clinicId", "role");

-- CreateIndex
CREATE INDEX "Pet_userId_createdAt_idx" ON "Pet"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_mobile_key" ON "Vendor"("mobile");

-- CreateIndex
CREATE INDEX "Vendor_serviceTypes_idx" ON "Vendor"("serviceTypes");

-- CreateIndex
CREATE INDEX "Vendor_onboardingCompleted_isActive_idx" ON "Vendor"("onboardingCompleted", "isActive");

-- CreateIndex
CREATE INDEX "Vendor_latitude_longitude_idx" ON "Vendor"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "ConsultationBooking_clinicId_scheduledAt_idx" ON "ConsultationBooking"("clinicId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ConsultationBooking_userId_createdAt_idx" ON "ConsultationBooking"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsultationBooking_vetId_scheduledAt_idx" ON "ConsultationBooking"("vetId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ConsultationBooking_status_paymentStatus_idx" ON "ConsultationBooking"("status", "paymentStatus");

-- CreateIndex
CREATE INDEX "ConsultationBooking_clinicId_queueStatus_scheduledAt_idx" ON "ConsultationBooking"("clinicId", "queueStatus", "scheduledAt");

-- CreateIndex
CREATE INDEX "VaccinationBooking_clinicId_scheduledAt_idx" ON "VaccinationBooking"("clinicId", "scheduledAt");

-- CreateIndex
CREATE INDEX "VaccinationBooking_userId_createdAt_idx" ON "VaccinationBooking"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ClinicInvite_clinicId_idx" ON "ClinicInvite"("clinicId");

-- CreateIndex
CREATE INDEX "ClinicInvite_mobile_idx" ON "ClinicInvite"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicInvite_clinicId_mobile_key" ON "ClinicInvite"("clinicId", "mobile");

-- CreateIndex
CREATE UNIQUE INDEX "VetRefreshToken_tokenHash_key" ON "VetRefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VetRefreshToken_vetId_idx" ON "VetRefreshToken"("vetId");

-- CreateIndex
CREATE INDEX "VetRefreshToken_familyId_idx" ON "VetRefreshToken"("familyId");

-- CreateIndex
CREATE INDEX "VetRefreshToken_expiresAt_idx" ON "VetRefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthChallenge_expiresAt_idx" ON "AuthChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthChallenge_kind_subject_key" ON "AuthChallenge"("kind", "subject");

-- AddForeignKey
ALTER TABLE "Vet" ADD CONSTRAINT "Vet_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicStaff" ADD CONSTRAINT "ClinicStaff_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationBooking" ADD CONSTRAINT "VaccinationBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationBooking" ADD CONSTRAINT "VaccinationBooking_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicInvite" ADD CONSTRAINT "ClinicInvite_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetRefreshToken" ADD CONSTRAINT "VetRefreshToken_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "Vet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.15                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

