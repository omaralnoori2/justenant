export type Role =
  | 'SUPER_ADMIN'
  | 'PORTAL_TEAM'
  | 'CMT'
  | 'LANDLORD'
  | 'TENANT'
  | 'SERVICE_PROVIDER';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type CmtStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  role: Role;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface CmtProfile {
  id: string;
  businessName: string;
  businessAddress: string;
  contactPhone: string;
  licenseNumber?: string;
  status: CmtStatus;
  rejectionReason?: string;
  subscriptionTier?: SubscriptionTier;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  maxTenants: number;
  maxProperties: number;
  pricePerMonth: number;
}
