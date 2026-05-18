// Alteha API Service - Using local proxy routes to avoid CORS

export interface ApiResponse<T = any> {
    code: string;
    message: string;
    data: T;
}

export interface AuthResponse {
    code: string;
    message: string;
    data?: {
        id_token: string;
    };
}

export interface Specialty {
    id: number;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
}

export interface Clinic {
    id: number;
    name: string;
    legalName: string;
    email: string;
    phone: string;
    rating: number;
    status: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    logoUrl?: string;
    identificationType?: string;
    identificationNumber?: string;
    healthLicenseNumber?: string;
    emergencyPhone?: string;
    website?: string;
    category?: string;
    operatingHours?: string;
    accreditations?: string;
    totalOperatingRooms?: number;
    bedsCount?: number;
    hasIcu?: boolean;
    hasEmergency?: boolean;
    hasPharmacy?: boolean;
    hasLaboratory?: boolean;
    hasImaging?: boolean;
    hasAmbulance?: boolean;
    hasParkingAvailable?: boolean;
    isWheelchairAccessible?: boolean;
    foundedYear?: number;
    contactPersonName?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    totalReviews?: number;
    verifiedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    stateProvinceName?: string | null;
    cityName?: string | null;
}

export interface Advertisement {
    id: number;
    code: string;
    actorRole: string;
    title: string;
    subtitle: string;
    bodyText: string;
    placement: string;
    mediaType: 'IMAGE' | 'VIDEO';
    mediaUrl: string;
    thumbnailUrl: string;
    clickUrl: string;
    ctaText: string;
    openInNewTab: boolean;
    priority: number;
    startAt: string;
    endAt: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DoctorRegistration {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
    identificationType: 'CEDULA' | 'PASAPORTE' | 'RIF';
    identificationNumber: string;
    medicalLicenseNumber: string;
    isIndependent: boolean;
    specialtyIds: number[];
    preferredClinicIds: number[];
    status?: 'PENDING' | 'ACTIVE';
}

export interface MedicalPackageItem {
    id?: number;
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface MedicalPackage {
    id?: number;
    packageName: string;
    packageCode: string;
    description: string;
    basePrice: number;
    discountedPrice: number;
    isActive?: boolean;
    validFrom: string;
    validUntil: string;
    createdAt?: string;
    updatedAt?: string;
    clinic?: any;
    doctor?: any;
    pharmacy?: any;
    specialty?: any;
    procedureType?: any;
    packageItems: MedicalPackageItem[];
}

export interface PatientRegistration {
    email: string;
    password?: string;
    phone: string;
    firstName: string;
    lastName: string;
    identificationType: 'CEDULA' | 'PASAPORTE' | 'RIF';
    identificationNumber: string;
    gender: 'MASCULINO' | 'FEMENINO' | 'OTRO';
    dateOfBirth: string;
    address: string;
    latitude: number;
    longitude: number;
    allergyIds?: number[];
    medicalConditionIds?: number[];
    currentMedicationIds?: number[];
    insurancePlanId?: number | null;
}

export interface Patient {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string | null;
    identificationType: string;
    identificationNumber: string;
    email: string;
    phone: string;
    profileImageUrl: string | null;
    gender: string;
    dateOfBirth: string;
    status: string;
    createdAt: string;
}

export interface ProcedureType {
    id: number;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
}

export interface ProcedureTemplate {
    id: number;
    procedureName: string;
    description: string;
    clinicBudget: number;
    doctorBudget: number;
    hospitalizationTime: number;
    active: boolean;
    patientGender: string | null;
    requiresHospitalization: boolean | null;
    estimatedDuration: number | null;
    anesthesiologist: boolean | null;
    biopsyRequired: boolean | null;
    numberOfAssistants: number | null;
    protocol: string | null;
    subSpecialty: string | null;
    equipment: string | null;
    specialty: Specialty | null;
    procedureType: ProcedureType;
}

// Auctions
export interface Auction {
    id: number;
    auctionNumber: string;
    title: string;
    description: string;
    auctionType: 'REVERSE_AUCTION' | 'STANDARD_AUCTION';
    status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'AWARDED' | 'PAID' | 'PAYMENT_REPORTED' | 'PAYMENT_VALIDATION' | 'CANCELLED' | 'COMPLETED';
    startDate: string;
    endDate: string;
    maxBudget: number;
    reservePrice?: number;
    currentLowestBid?: number | null;
    totalBids?: number | null;
    estimatedSurgeryDate?: string;
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    patientAge: number;
    patientGender: 'MASCULINO' | 'FEMENINO' | 'OTRO';
    medicalHistory: string;
    medicalReportUrl: string;
    preferredLocation: string;
    requiresHospitalization: boolean;
    estimatedDurationDays: number;
    specialRequirements: string;
    termsAndConditions: string;
    termsAndConditionsAccepted: boolean;
    showPrice: boolean;
    durationHours: number;
    autoExtendMinutes: number;
    minBidsRequired: number;
    createdAt: string;
    updatedAt: string | null;
    insuranceCompany?: { id: number; name?: string; logoUrl?: string };
    patient?: Patient;
    specialty?: Specialty;
    procedureType?: any;
    currency?: any;
    clinicBudget?: number;
    doctorBudget?: number;
    requiredSupplies?: RequiredSupply[];
    invitedDoctorIds?: number[];
    invitedClinicIds?: number[];
    winningBid?: any;
    methodType?: string;
    allowedPaymentMethods?: string[];
}

export interface AuctionPayload {
    auctionNumber?: string;
    createdAt?: string;
    title: string;
    description: string;
    auctionType: string;
    status: string;
    startDate: string;
    endDate: string;
    maxBudget: number;
    reservePrice?: number;
    urgencyLevel: string;
    patientAge: number;
    patientGender: string;
    medicalHistory: string;
    preferredLocation: string;
    requiresHospitalization: boolean;
    estimatedDurationDays: number;
    estimatedDuration?: number | null;
    anesthesiologist?: boolean | null;
    biopsyRequired?: boolean | null;
    numberOfAssistants?: number | null;
    protocol?: string | null;
    subSpecialty?: string | null;
    equipment?: string | null;
    specialRequirements: string;
    termsAndConditions: string;
    termsAndConditionsAccepted: boolean;
    showPrice: boolean;
    durationHours: number;
    autoExtendMinutes: number;
    minBidsRequired: number;
    estimatedSurgeryDate: string;
    patient: { id: number };
    specialty: { id: number };
    currency: { id: number };
    procedureType: { id: number };
    insuranceCompany?: { id: number };
    clinicBudget?: number;
    doctorBudget?: number;
    requiredSupplies?: RequiredSupply[];
    configurationId?: number | null;
    invitedDoctorIds?: number[];
    invitedClinicIds?: number[];
    methodType?: string;
    allowedPaymentMethods?: string[];
}

export interface RequiredSupply {
    id?: number;
    itemName: string;
    description: string;
    quantity: number;
    referenceAmount: number;
}

export interface BidItem {
    id?: number;
    itemName?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    auctionSupply: { id: number };
}

export interface BidPayload {
    auction: { id: number };
    bidAmount?: number;
    bidType: 'DOCTOR_ONLY' | 'CLINIC_ONLY' | 'BOTH' | 'PHARMACY';
    proposedStartDate?: string;
    estimatedDurationDays?: number;
    notes: string;
    bidItems?: BidItem[];
    clinic?: { id: number };
    clinicId?: number;
    doctor?: { id: number };
    doctorId?: number;
}

export interface Bid {
    id: number;
    bidNumber: string;
    bidAmount: number;
    status: string;
    proposedStartDate: string | null;
    estimatedDurationDays: number | null;
    notes: string;
    isWinning: boolean;
    submittedAt: string;
    bidType: string;
    auction: Partial<Auction>;
    doctor?: any;
    clinic?: any;
    pharmacy?: any;
    bidItems?: any[];
}

export interface PaymentMethod {
    id?: number;
    actorRole: string;
    methodType: 'BS_PAGO_MOVIL' | 'BS_BANK_TRANSFER' | 'USD_WIRE_SWIFT' | 'USD_ACH' | 'USD_IBAN' | 'BINANCE_PAY' | 'CRYPTO_WALLET';
    beneficiaryType: 'PERSON' | 'BUSINESS';
    verificationStatus?: string;
    displayName: string;
    active?: boolean;
    binancePayId?: string;
    binanceUserIdentifier?: string;
    cryptoAsset?: string;
    cryptoNetwork?: string;
    cryptoWalletAddress?: string;
    cryptoMemoOrTag?: string;
    createdAt?: string;
    updatedAt?: string;
    country: { id: number; name?: string };
    owner?: { id: number; firstName?: string; lastName?: string; email?: string };
    bankAccount?: {
        id?: number;
        currency: string;
        holderFullName: string;
        holderDocument: string;
        phone?: string;
        bankCode?: string;
        bankName: string;
        accountNumber?: string;
        iban?: string;
        swiftCode?: string;
        abaRoutingNumber?: string;
        bankCountry?: string;
        bankAddress?: string;
    };
}

export interface AuctionAttachment {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    description: string | null;
    uploadedAt: string;
}

// Role Mapping
const roleMapping: Record<string, string> = {
    'specialist': 'DOCTOR',
    'clinic': 'CLINIC',
    'insurance': 'INSURANCE_COMPANY',
    'provider': 'PHARMACY',
    'pharmacy': 'PHARMACY',
    'health-fund': 'HEALTH_FUND',
    'approval': 'ADMIN'
};

// Authentication
export async function authenticate(
    username: string,
    password: string,
    role: string = 'specialist',
    rememberMe: boolean = true,
    captchaToken?: string,
    deviceId?: string
): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password,
            role: roleMapping[role] || 'DOCTOR',
            rememberMe,
            captchaToken,
            deviceId
        })
    });
    return response.json();
}

// SMS Verification
export async function sendSmsToken(phone: string, role: string = 'DOCTOR'): Promise<ApiResponse> {
    const response = await fetch('/api/sms-verification/send-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role })
    });
    return response.json();
}

export async function verifySmsToken(phone: string, token: string, role: string = 'DOCTOR'): Promise<ApiResponse<boolean>> {
    const response = await fetch('/api/sms-verification/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token, role })
    });
    return response.json();
}

// Email Verification
export async function sendEmailToken(email: string, role: string = 'DOCTOR'): Promise<ApiResponse> {
    const response = await fetch('/api/email-verification/send-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
    });
    return response.json();
}

export async function verifyEmailToken(email: string, token: string, role: string = 'DOCTOR'): Promise<ApiResponse<boolean>> {
    const response = await fetch('/api/email-verification/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, role })
    });
    return response.json();
}

// Get Specialties
export async function getSpecialties(page: number = 0, size: number = 50): Promise<Specialty[]> {
    const response = await fetch(`/api/specialties?page=${page}&size=${size}`);
    return response.json();
}

// Get Clinics
export async function getClinics(page: number = 0, size: number = 50): Promise<Clinic[]> {
    const response = await fetch(`/api/clinics?page=${page}&size=${size}`);
    return response.json();
}

// Get Doctors
export async function getDoctors(page: number = 0, size: number = 50): Promise<ActorProfile[]> {
    const response = await fetch(`/api/doctors?page=${page}&size=${size}`);
    return response.json();
}

// Service Interface
export interface Service {
    id: number;
    name: string;
    description: string;
}

// Get Services
export async function getServices(page: number = 0, size: number = 100): Promise<Service[]> {
    const response = await fetch(`/api/services?page=${page}&size=${size}`);
    return response.json();
}

// Get Procedure Types
export async function getProcedureTypes(page: number = 0, size: number = 100): Promise<ProcedureType[]> {
    const response = await fetch(`/api/procedure-types?page=${page}&size=${size}`);
    return response.json();
}

// Get Procedure Templates
export async function getProcedureTemplates(procedureTypeId: number): Promise<ProcedureTemplate[]> {
    const response = await fetch(`/api/procedure-templates/by-procedure-type/${procedureTypeId}`);
    return response.json();
}

// Check doctor exists
export async function checkDoctorExists(identificationNumber: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/doctors?identificationNumber.contains=${identificationNumber}&page=0&size=1`);
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
    } catch (error) {
        console.error('Error checking doctor:', error);
        return false;
    }
}

// Clinic Registration Interface
export interface ClinicRegistration {
    email: string;
    password: string;
    phone: string;
    name: string;
    legalName: string;
    identificationType: 'CEDULA' | 'PASAPORTE' | 'RIF';
    identificationNumber: string;
    website?: string;
    healthLicenseNumber: string;
    address: string;
    latitude: number;
    longitude: number;
    specialtyIds: number[];
    servicioIds: number[];
}

// Pharmacy Registration Interface
export interface PharmacyRegistration {
    email: string;
    password: string;
    phone: string;
    name: string;
    legalName: string;
    pharmacyLicenseNumber: string;
    pharmacyType: 'RETAIL' | 'HOSPITAL' | 'CHAIN';
    identificationType: 'CEDULA' | 'PASAPORTE' | 'RIF';
    identificationNumber: string;
    address: string;
    latitude: number;
    longitude: number;
    website?: string;
}

export interface ActorProfile {
    id: number;
    firstName?: string;
    lastName?: string;
    fullName: string | null;
    email: string;
    phone: string;
    profileImageUrl: string | null;
    logoUrl?: string | null;
    commercialName?: string;
    legalName?: string;
    identificationType: string;
    identificationNumber: string;
    insuranceLicenseNumber?: string;
    healthLicenseNumber?: string;
    pharmacyLicenseNumber?: string;
    pharmacyType?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    name?: string;
    website?: string | null;
    contactPersonName?: string;
    contactPersonEmail?: string | null;
    contactPersonPhone?: string | null;
    isIndependent?: boolean;
    status: string;
    createdAt?: string;
    specialties?: Array<{
        id: number;
        name: string | null;
        code: string | null;
    }>;
    preferredClinics?: Array<{
        id: number;
        name: string | null;
        logoUrl?: string | null;
    }>;
}



// Register Doctor
export async function registerDoctor(
    registration: DoctorRegistration,
    profileImage?: File,
    medicalLicense?: File,
    captchaToken?: string
): Promise<ApiResponse> {
    const formData = new FormData();

    // Add CAPTCHA token
    if (captchaToken) {
        formData.append('captchaToken', captchaToken);
    }

    // Add registration data as JSON blob
    const registrationBlob = new Blob([JSON.stringify(registration)], { type: 'application/json' });
    formData.append('registration', registrationBlob);

    // Add files if provided
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }
    if (medicalLicense) {
        formData.append('medicalLicense', medicalLicense);
    }

    const response = await fetch('/api/actor-register/doctor', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

// Register Clinic
export async function registerClinic(
    registration: ClinicRegistration,
    rifFile?: File,
    mercantileRegistryFile?: File,
    logoFile?: File,
    captchaToken?: string
): Promise<ApiResponse> {
    const formData = new FormData();

    // Add CAPTCHA token
    if (captchaToken) {
        formData.append('captchaToken', captchaToken);
    }

    // Add registration data as JSON blob
    const registrationBlob = new Blob([JSON.stringify(registration)], { type: 'application/json' });
    formData.append('registration', registrationBlob);

    // Add files if provided
    if (rifFile) {
        formData.append('rifFile', rifFile);
    }
    if (mercantileRegistryFile) {
        formData.append('mercantileRegistryFile', mercantileRegistryFile);
    }
    if (logoFile) {
        formData.append('logoFile', logoFile);
    }

    const response = await fetch('/api/actor-register/clinic', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

// Register Pharmacy
export async function registerPharmacy(
    registration: PharmacyRegistration,
    rifFile?: File,
    mercantileRegistryFile?: File,
    sanitaryLicenseFile?: File,
    logoFile?: File,
    captchaToken?: string
): Promise<ApiResponse> {
    const formData = new FormData();

    // Add CAPTCHA token
    if (captchaToken) {
        formData.append('captchaToken', captchaToken);
    }

    // Add registration data as JSON blob
    const registrationBlob = new Blob([JSON.stringify(registration)], { type: 'application/json' });
    formData.append('registration', registrationBlob);

    // Add files if provided
    if (rifFile) formData.append('rifFile', rifFile);
    if (mercantileRegistryFile) formData.append('mercantileRegistryFile', mercantileRegistryFile);
    if (sanitaryLicenseFile) formData.append('sanitaryLicenseFile', sanitaryLicenseFile);
    if (logoFile) formData.append('logoFile', logoFile);

    const response = await fetch('/api/actor-register/pharmacy', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

// Register Health Fund
export async function registerHealthFund(
    registration: any,
    rifFile?: File,
    mercantileRegistryFile?: File,
    logoFile?: File,
    captchaToken?: string
): Promise<ApiResponse> {
    const formData = new FormData();

    if (captchaToken) {
        formData.append('captchaToken', captchaToken);
    }

    const registrationBlob = new Blob([JSON.stringify(registration)], { type: 'application/json' });
    formData.append('registration', registrationBlob);

    if (rifFile) formData.append('rifFile', rifFile);
    if (mercantileRegistryFile) formData.append('mercantileRegistryFile', mercantileRegistryFile);
    if (logoFile) formData.append('logoFile', logoFile);

    const response = await fetch('/api/actor-register/health-fund', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

// Get User Profile
export async function getProfile(role: string = 'DOCTOR'): Promise<ApiResponse<ActorProfile>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor/profile?role=${role}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

/**
 * Updates the doctor profile by sending multipart/form-data to the backend.
 * @param formData FormData containing 'doctor' JSON string and optional files
 */
export async function updateDoctorProfile(formData: FormData): Promise<ApiResponse> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor/profile/update`, {
        method: 'PUT',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar el perfil');
    }
    return response.json();
}

// Get Doctor Additional Files
export async function getDoctorFiles(): Promise<any[]> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor/files`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    if (!response.ok) {
        throw new Error('Failed to load doctor files');
    }
    return response.json();
}

// Upload Doctor Additional File
export async function uploadDoctorFile(formData: FormData): Promise<any> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor/files`, {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir el archivo');
    }
    return response.json();
}

// Update Doctor Additional File
export async function updateDoctorFile(id: number | string, formData: FormData): Promise<any> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor/files/${id}`, {
        method: 'PUT',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar el archivo');
    }
    return response.json();
}

// Delete Doctor Additional File
export async function deleteDoctorFile(id: number | string): Promise<void> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor/files/${id}`, {
        method: 'DELETE',
        headers: {
            'X-Alteha-Token': token
        }
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar el archivo');
    }
}

// Get Dashboard Ads
export async function getDashboardAds(
    role: string = 'DOCTOR',
    page: number = 0,
    size: number = 20
): Promise<ApiResponse<Advertisement[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/dashboard-ads/list?role=${role}&page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

// Submit Identity Compliance
export async function submitIdentityCompliance(
    actorRole: string,
    documentType: string,
    matchPercentage: number,
    formData: FormData
): Promise<ApiResponse> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/identity-compliances/submit?actorRole=${actorRole}&documentType=${documentType}&matchPercentage=${matchPercentage}`, {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    return response.json();
}

// Get Identity Compliance Status (Secure Lookup)
export async function getIdentityCompliance(actorId: number | string): Promise<ApiResponse> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/identity-compliances/secure/${actorId}?actorRole=ADMIN`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

// Search Identity Compliance with filters (e.g., accountId.equals=123)
export async function searchIdentityCompliance(filters: string): Promise<ApiResponse> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/identity-compliances?${filters}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

// Patient Management (Insurance)
export async function registerPatient(
    registration: PatientRegistration,
    profileImage?: File,
    verificationDocuments?: File[]
): Promise<ApiResponse<Patient>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const formData = new FormData();
    const registrationWithSex = {
        ...registration,
        sex: registration.gender // Add sex field as some backend versions use it instead of gender
    };
    const registrationBlob = new Blob([JSON.stringify(registrationWithSex)], { type: 'application/json' });
    formData.append('registration', registrationBlob);

    if (profileImage) {
        formData.append('profileImage', profileImage);
    }

    if (verificationDocuments && verificationDocuments.length > 0) {
        verificationDocuments.forEach((doc) => {
            formData.append('verificationDocuments', doc);
        });
    }

    const response = await fetch('/api/actor-register/insurance-register-patient', {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    return response.json();
}

export async function searchPatient(
    documentType: string,
    documentNumber: string,
    role: string = 'INSURANCE_COMPANY'
): Promise<ApiResponse<Patient>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor-register/search-patient?role=${role}&documentType=${documentType}&documentNumber=${documentNumber}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

export async function searchPatientByPhone(
    phone: string,
    role: string = 'PATIENT'
): Promise<ApiResponse<Patient | Patient[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    // Try with phone.equals first (JHipster standard)
    let response = await fetch(`/api/actor-register/search-patient?role=${role}&phone.equals=${phone}`, {
        method: 'GET',
        headers: { 'X-Alteha-Token': token }
    });
    let result = await response.json();

    // If not found, try with simple phone parameter as fallback
    if ((!result.data || (Array.isArray(result.data) && result.data.length === 0)) && response.status === 200) {
        console.log('[API] phone.equals failed, trying phone fallback...');
        response = await fetch(`/api/actor-register/search-patient?role=${role}&phone=${phone}`, {
            method: 'GET',
            headers: { 'X-Alteha-Token': token }
        });
        result = await response.json();
    }
    
    return result;
}

export async function searchPatientByEmail(
    email: string,
    role: string = 'PATIENT'
): Promise<ApiResponse<Patient | Patient[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    // Try with email.equals first
    let response = await fetch(`/api/actor-register/search-patient?role=${role}&email.equals=${email}`, {
        method: 'GET',
        headers: { 'X-Alteha-Token': token }
    });
    let result = await response.json();

    // Fallback to simple email parameter
    if ((!result.data || (Array.isArray(result.data) && result.data.length === 0)) && response.status === 200) {
        console.log('[API] email.equals failed, trying email fallback...');
        response = await fetch(`/api/actor-register/search-patient?role=${role}&email=${email}`, {
            method: 'GET',
            headers: { 'X-Alteha-Token': token }
        });
        result = await response.json();
    }
    
    return result;
}

export async function updatePatient(
    patientId: number | string,
    updateData: Partial<PatientRegistration>
): Promise<ApiResponse<Patient>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    // Add sex field for compatibility
    const dataWithSex = {
        ...updateData,
        sex: updateData.gender
    };

    const response = await fetch(`/api/actor-register/insurance-update-patient/${patientId}`, {
        method: 'PUT',
        headers: {
            'X-Alteha-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataWithSex)
    });
    return response.json();
}

export async function getPatient(patientId: string | number): Promise<ApiResponse<Patient>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    try {
        // Try direct fetch first
        const response = await fetch(`/api/actor-register/insurance-update-patient/${patientId}`, {
            method: 'GET',
            headers: {
                'X-Alteha-Token': token
            }
        });
        
        const result = await response.json();
        
        // If 405 or not found, try searching by document number as a fallback
        // Many times the ID in the URL is actually the identificationNumber or can be used to find it
        if (response.status === 405 || response.status === 404 || result.code !== '00') {
            console.log(`[API] GET by ID not supported or not found (Status ${response.status}). Trying fallback search...`);
            
            // Try searching as a patient with default document type 'V'
            const searchResult = await searchPatient('V', String(patientId));
            if (searchResult.code === '00' && searchResult.data) {
                const data = Array.isArray(searchResult.data) ? searchResult.data[0] : searchResult.data;
                return {
                    code: '00',
                    message: 'Found via fallback search',
                    data: data
                };
            }
        }
        
        return result;
    } catch (error) {
        console.error('getPatient error:', error);
        // Try fallback even on network error
        return searchPatient('V', String(patientId)) as any;
    }
}

// Auction Management Hooks
export async function publishAuction(
    payload: AuctionPayload,
    medicalReport?: File
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const formData = new FormData();
    const auctionBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    formData.append('auction', auctionBlob);

    if (medicalReport) {
        formData.append('medicalReport', medicalReport);
    }

    const response = await fetch('/api/auctions/publish', {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    return response.json();
}

export async function changeAuctionStatus(
    auctionNumber: string,
    newStatus: string,
    reason: string = 'Cambio de estado manual',
    bidId?: number
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch('/api/auctions/change-status', {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            auctionNumber,
            newStatus,
            reason,
            bidId
        })
    });
    return response.json();
}

export async function awardAuction(
    auctionNumber: string,
    bidId: number
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/${auctionNumber}/award/${bidId}`, {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

export async function addAuctionAttachments(
    auctionNumber: string,
    files: File[]
): Promise<ApiResponse<AuctionAttachment[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    const response = await fetch(`/api/auctions/attachments?auctionNumber=${auctionNumber}`, {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        },
        body: formData
    });
    return response.json();
}

export async function getAuctionDetails(
    auctionNumber: string,
    role: string = 'INSURANCE_COMPANY'
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/details/${auctionNumber}?role=${role}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

export async function updateAuction(
    auctionNumber: string,
    payload: AuctionPayload
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/update/${auctionNumber}`, {
        method: 'PUT',
        headers: {
            'X-Alteha-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}

export async function publishExistingAuction(auctionNumber: string): Promise<ApiResponse<Auction>> {
    return changeAuctionStatus(auctionNumber, 'PUBLISHED', 'publicar la subasta');
}

export async function getAllAuctions(
    status?: string,
    page: number = 0,
    size: number = 50,
    sort: string = 'createdAt,desc'
): Promise<ApiResponse<Auction[] | { content: Auction[] }>> {
    let url = `/api/auctions/all?page=${page}&size=${size}&sort=${sort}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url, {
        method: 'GET'
    });

    return response.json();
}

export async function getMyAuctions(
    status?: string,
    page: number = 0,
    size: number = 10,
    sort: string = 'desc'
): Promise<ApiResponse<Auction[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    let url = `/api/auctions/my-auctions?page=${page}&size=${size}&sort=${sort}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

export async function getMyInvitations(
    actorRole: string = 'DOCTOR',
    page: number = 0,
    size: number = 10,
    sort: string = 'desc'
): Promise<ApiResponse<Auction[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/invitations?actorRole=${actorRole}&page=${page}&size=${size}&sort=${sort}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

export async function getAuctionAttachments(
    auctionNumber: string,
    actorRole: string = 'DOCTOR'
): Promise<ApiResponse<AuctionAttachment[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/attachments/list?auctionNumber=${auctionNumber}&actorRole=${actorRole}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}



export async function getDoctorById(id: number | string): Promise<ApiResponse<ActorProfile>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/doctors/${id}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

export async function getInsuranceCompanyById(id: number | string): Promise<ApiResponse<ActorProfile>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/insurance-companies/${id}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

// Helper to get stored token
export function getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('id_token');
    }
    return null;
}

export async function getAuctionDetailsAsDoctor(
    auctionNumber: string
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/doctor/details/${auctionNumber}`, {
        method: 'GET',
        headers: {
            'X-Alteha-Token': token
        }
    });
    return response.json();
}

// Bid listing
export interface BidItem {
    id: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface BidDetailed {
    id: number;
    auctionId?: number;
    auctionNumber?: string;
    totalAmount?: number;
    bidAmount?: number;
    doctorFee?: number;
    clinicFee?: number;
    status?: string;
    createdAt?: string;
    notes?: string;
    proposedStartDate?: string;
    estimatedDurationDays?: number;
    bidType?: string;
    bidNumber?: string;
    bidItems?: BidItem[];
    doctor?: {
        id: number;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        profileImageUrl?: string | null;
        specialties?: Array<{ id: number; name: string | null; code: string | null }>;
    };
    clinic?: {
        id: number;
        name?: string;
        logoUrl?: string | null;
    };
}

export interface TopOffer {
    rank?: number;
    bidId?: number;
    totalAmount?: number;
    bidAmount?: number;
    doctorFee?: number;
    clinicFee?: number;
    doctorName?: string;
    doctorProfileImageUrl?: string | null;
    clinicName?: string;
    specialties?: string[];
    createdAt?: string;
    status?: string;
}

export async function getAuctionBids(
    auctionId: number | string,
    page: number = 0,
    size: number = 50
): Promise<ApiResponse<BidDetailed[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/bids/list?auctionId=${auctionId}&page=${page}&size=${size}`, {
        method: 'GET',
        headers: { 'X-Alteha-Token': token }
    });
    return response.json();
}

export async function getAuctionBidsCount(
    auctionId: number | string
): Promise<{ count: number }> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/bids/count?auctionId=${auctionId}`, {
        method: 'GET',
        headers: { 'X-Alteha-Token': token }
    });
    return response.json();
}

export async function getTopOffers(
    auctionId: number | string
): Promise<ApiResponse<TopOffer[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/${auctionId}/top-offers`, {
        method: 'GET',
        headers: { 'X-Alteha-Token': token }
    });
    return response.json();
}

export async function placeAdvancedBid(
    payload: BidPayload
): Promise<ApiResponse<Bid>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch('/api/bids/advanced', {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}


// Helper to store token
export function storeToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('id_token', token);
    }
}

// Helper to clear token
export function clearToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('id_token');
    }
}

export const createMedicalPackage = async (data: Partial<MedicalPackage>): Promise<ApiResponse<MedicalPackage>> => {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    try {
        const response = await fetch('/api/medical-packages/my/packages', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Alteha-Token': token
            },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating medical package:', error);
        throw error;
    }
};

export const getMyMedicalPackages = async (page: number = 0, size: number = 20): Promise<ApiResponse<MedicalPackage[]>> => {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    try {
        const response = await fetch(`/api/medical-packages/my/packages?page=${page}&size=${size}`, {
            headers: {
                'X-Alteha-Token': token
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching my medical packages:', error);
        throw error;
    }
};

export const getAllMedicalPackages = async (page: number = 0, size: number = 10): Promise<ApiResponse<MedicalPackage[]>> => {
    const token = getStoredToken();
    
    try {
        const response = await fetch(`/api/medical-packages/all?page=${page}&size=${size}`, {
            headers: {
                ...(token && { 'X-Alteha-Token': token })
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching all medical packages:', error);
        throw error;
    }
};

// Payment Methods
export async function getPaymentMethods(role: string, page: number = 0, size: number = 20): Promise<ApiResponse<PaymentMethod[]>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    const response = await fetch(`/api/payment-receiving-methods/my/payment-methods?role=${role}&page=${page}&size=${size}`, {
        headers: { 'X-Alteha-Token': token }
    });
    return response.json();
}

export async function getAvailablePaymentMethodsForAuction(auctionNumber: string): Promise<PaymentMethod[]> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    const response = await fetch(`/api/auctions/${auctionNumber}/available-payment-methods`, {
        headers: { 'X-Alteha-Token': token }
    });
    
    const result = await response.json();
    let methods: PaymentMethod[] = [];
    if (Array.isArray(result)) methods = result;
    else if (result.data && Array.isArray(result.data)) methods = result.data;
    
    // Temporal Fallback Mock expandido para soportar todos los tipos de pago (a solicitud del usuario para continuar pruebas)
    if (methods.length === 0) {
        return [
          {
            "id": 1500,
            "actorRole": "ADMIN",
            "methodType": "BS_PAGO_MOVIL",
            "displayName": "Pago Móvil Alteha - Mercantil",
            "active": true,
            "beneficiaryType": "JURIDICO",
            "verificationStatus": "VERIFIED",
            "instructions": "Enviar comprobante inmediatamente.",
            "bankAccount": {
              "id": 10,
              "currency": "BS",
              "holderFullName": "ALTEHA MEDICAL SOLUTIONS C.A.",
              "holderDocument": "J-123456789",
              "bankName": "BANCO MERCANTIL",
              "phone": "04121234567"
            }
          },
          {
            "id": 1501,
            "actorRole": "ADMIN",
            "methodType": "BS_BANK_TRANSFER",
            "displayName": "Transferencia Alteha - Banesco",
            "active": true,
            "beneficiaryType": "JURIDICO",
            "verificationStatus": "VERIFIED",
            "instructions": "Transferencias mismo banco o interbancarias.",
            "bankAccount": {
              "id": 11,
              "currency": "BS",
              "holderFullName": "ALTEHA MEDICAL SOLUTIONS C.A.",
              "holderDocument": "J-123456789",
              "bankName": "BANESCO",
              "accountNumber": "01340001010001234567"
            }
          },
          {
            "id": 1502,
            "actorRole": "ADMIN",
            "methodType": "USD_ACH",
            "displayName": "Alteha USD - Chase Bank (ACH)",
            "active": true,
            "beneficiaryType": "JURIDICO",
            "verificationStatus": "VERIFIED",
            "instructions": "Acepta Zelle o transferencias domésticas USA.",
            "bankAccount": {
              "id": 12,
              "currency": "USD",
              "holderFullName": "ALTEHA SOLUTIONS LLC",
              "bankName": "CHASE BANK",
              "accountNumber": "987654321",
              "abaRoutingNumber": "021000021"
            }
          },
          {
            "id": 1503,
            "actorRole": "ADMIN",
            "methodType": "USD_WIRE_SWIFT",
            "displayName": "Alteha International - SWIFT",
            "active": true,
            "beneficiaryType": "JURIDICO",
            "verificationStatus": "VERIFIED",
            "instructions": "Para transferencias internacionales fuera de USA.",
            "bankAccount": {
              "id": 13,
              "currency": "USD",
              "holderFullName": "ALTEHA MEDICAL SOLUTIONS",
              "bankName": "CITIBANK N.A.",
              "accountNumber": "1122334455",
              "swiftCode": "CITIUS33"
            }
          },
          {
            "id": 1504,
            "actorRole": "ADMIN",
            "methodType": "BINANCE_PAY",
            "displayName": "Alteha Binance Pay (USDT)",
            "active": true,
            "beneficiaryType": "JURIDICO",
            "verificationStatus": "VERIFIED",
            "instructions": "Pago vía Binance Pay ID.",
            "binancePayId": "88776655",
            "binanceUserIdentifier": "alteha_payments@binance.com"
          }
        ] as PaymentMethod[];
    }
    
    return methods;
}

export async function registerAuctionPaymentProof(formData: FormData): Promise<ApiResponse<any>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    const response = await fetch('/api/auctions/register-payment-proof', {
        method: 'POST',
        headers: { 'X-Alteha-Token': token },
        body: formData
    });
    return response.json();
}

export async function validateAuctionPayment(payload: {
    auctionNumber: string;
    isValid: boolean;
    notes: string;
}): Promise<ApiResponse<any>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    const response = await fetch('/api/auctions/validate-payment', {
        method: 'POST',
        headers: { 
            'X-Alteha-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}

export async function completeAuction(auctionNumber: string, settlementFile: File): Promise<ApiResponse<any>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    
    const formData = new FormData();
    formData.append('settlementFile', settlementFile);
    
    const response = await fetch(`/api/auctions/${auctionNumber}/complete`, {
        method: 'POST',
        headers: { 
            'X-Alteha-Token': token
        },
        body: formData
    });
    return response.json();
}

export async function getWinnerPaymentMethods(auctionNumber: string, role: 'DOCTOR' | 'CLINIC'): Promise<PaymentMethod[]> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    
    const response = await fetch(`/api/auctions/${auctionNumber}/winner-payment-methods?role=${role}`, {
        headers: { 'X-Alteha-Token': token }
    });
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
}

export async function createPaymentMethod(method: PaymentMethod): Promise<ApiResponse<PaymentMethod>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    const response = await fetch('/api/payment-receiving-methods/my/payment-methods', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Alteha-Token': token 
        },
        body: JSON.stringify(method)
    });
    return response.json();
}

export async function updatePaymentMethod(id: number, method: PaymentMethod, role: string): Promise<ApiResponse<PaymentMethod>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');
    const response = await fetch(`/api/payment-receiving-methods/my/payment-methods/${id}?role=${role}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'X-Alteha-Token': token 
        },
        body: JSON.stringify(method)
    });
    return response.json();
}

export async function updateDeviceId(role: string, deviceId: string): Promise<ApiResponse> {
    const userToken = getStoredToken();
    if (!userToken) return { code: 'AUTH_001', message: 'No session' };

    const response = await fetch(`/api/actor/update-device-id?role=${role}&deviceId=${deviceId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    return response.json();
}

/**
 * Gets or generates a unique device ID for the current browser/device.
 * Stores it in localStorage for persistence.
 */
export function getDeviceId(): string {
    if (typeof window === 'undefined') return '';
    
    let deviceId = localStorage.getItem('alteha_device_id');
    
    if (!deviceId) {
        // Generate a simple UUID-like string
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('alteha_device_id', deviceId);
    }
    
    return deviceId;
}
