import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
    lastUsedDate: string;
    dailyUsesCount: bigint;
}
export interface UTRSubmission {
    status: UTRStatus;
    principal: Principal;
    submittedAt: bigint;
    email: string;
    utrId: string;
}
export interface DailyUsageResponse {
    date: string;
    count: bigint;
}
export enum SubscriptionTier {
    pro = "pro",
    free = "free"
}
export enum UTRStatus {
    pending = "pending",
    approved = "approved"
}
export enum UTRVerificationStatus {
    notSubmitted = "notSubmitted",
    pending = "pending",
    approved = "approved"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveUTR(principalToApprove: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    batchApproveUTRs(): Promise<void>;
    countSubscribers(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyUsage(): Promise<DailyUsageResponse>;
    getIsPro(): Promise<boolean>;
    getMyVerificationStatus(): Promise<UTRVerificationStatus>;
    getPendingVerifications(): Promise<Array<UTRSubmission>>;
    getSubscription(): Promise<SubscriptionTier>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSubscription(user: Principal): Promise<SubscriptionTier>;
    incrementDailyUsage(today: string): Promise<DailyUsageResponse>;
    isCallerAdmin(): Promise<boolean>;
    isProCaller(): Promise<boolean>;
    isProUser(user: Principal): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitUTR(email: string, utrId: string): Promise<void>;
    subscribe(tier: SubscriptionTier): Promise<void>;
}
