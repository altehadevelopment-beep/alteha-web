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

// Auctions
export interface Auction {
    id: number;
    auctionNumber: string;
    title: string;
    description: string;
    auctionType: 'REVERSE_AUCTION' | 'STANDARD_AUCTION';
    status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'AWARDED' | 'CANCELLED' | 'COMPLETED';
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
}

export interface RequiredSupply {
    id?: number;
    itemName: string;
    description: string;
    quantity: number;
    referenceAmount: number;
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
    'health-fund': 'HEALTH_FUND'
};

// Authentication
export async function authenticate(
    username: string,
    password: string,
    role: string = 'specialist',
    rememberMe: boolean = true,
    captchaToken?: string
): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password,
            role: roleMapping[role] || 'DOCTOR',
            rememberMe,
            captchaToken
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
    const registrationBlob = new Blob([JSON.stringify(registration)], { type: 'application/json' });
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

export async function updatePatient(
    patientId: number | string,
    updateData: Partial<PatientRegistration>
): Promise<ApiResponse<Patient>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/actor-register/insurance-update-patient/${patientId}`, {
        method: 'PUT',
        headers: {
            'X-Alteha-Token': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    return response.json();
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

export async function publishExistingAuction(
    auctionNumber: string
): Promise<ApiResponse<Auction>> {
    const token = getStoredToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`/api/auctions/publish-existing/${auctionNumber}`, {
        method: 'POST',
        headers: {
            'X-Alteha-Token': token
        }
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
