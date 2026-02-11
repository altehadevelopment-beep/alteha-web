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
}

export interface DoctorRegistration {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
    identificationType: 'CEDULA' | 'PASSPORT' | 'RIF';
    identificationNumber: string;
    medicalLicenseNumber: string;
    isIndependent: boolean;
    specialtyIds: number[];
    preferredClinicIds: number[];
    status?: 'PENDING' | 'ACTIVE';
}

// Role Mapping
const roleMapping: Record<string, string> = {
    'specialist': 'DOCTOR',
    'clinic': 'CLINIC',
    'insurance': 'INSURANCE_COMPANY',
    'provider': 'PHARMACY',
    'pharmacy': 'PHARMACY'
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

// Clinic Registration Interface
export interface ClinicRegistration {
    email: string;
    password: string;
    phone: string;
    name: string;
    legalName: string;
    identificationType: 'CEDULA' | 'PASSPORT' | 'RIF';
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
    identificationType: 'CEDULA' | 'PASSPORT' | 'RIF';
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



// Helper to get stored token
export function getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('id_token');
    }
    return null;
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
