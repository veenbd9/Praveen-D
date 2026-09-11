import { supabase } from './supabaseClient';
import type { User, SubscriptionDetails } from '../types';
import { getPlanQuota } from '../lib/paymentPlans';

const DEFAULT_SUBSCRIPTION: SubscriptionDetails = {
  isActive: true,
  planType: 'free',
  startDate: Date.now(),
  expiryDate: 9999999999999,
  hasCompletedThreeMonthPlan: false,
  usageCount: 0,
  resumeLimit: 1,
  lastUsageReset: Date.now(),
};

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  countryCode: string;
  phoneNumber: string;
}

/**
 * Maps a Supabase auth user + its `profiles` row into the app's internal
 * `User` shape used throughout the UI.
 */
const mapToAppUser = (authUser: any, profile: any): User => {
  const subscription = profile?.subscription ?? DEFAULT_SUBSCRIPTION;
  return {
    name: profile?.name ?? authUser.user_metadata?.name ?? authUser.email,
    email: authUser.email,
    isAdmin: profile?.is_admin ?? false,
    countryCode: profile?.country_code ?? '+91',
    phoneNumber: profile?.phone_number ?? '',
    status: profile?.status ?? 'ACTIVE',
    resumeMismatchCount: profile?.resume_mismatch_count ?? 0,
    subscription: {
      ...DEFAULT_SUBSCRIPTION,
      ...subscription,
      resumeLimit: subscription.planType === 'free' ? 1 : subscription.resumeLimit ?? getPlanQuota(subscription.planType) ?? 1,
    },
  };
};

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
};

export const signUp = async ({ name, email, password, countryCode, phoneNumber }: SignUpInput) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, country_code: countryCode, phone_number: phoneNumber } },
  });
  if (error) throw error;

  // The `profiles` row is created automatically by a Postgres trigger
  // (see supabase/schema.sql: handle_new_user()) that copies the metadata
  // above into a row keyed by auth.users.id. We don't need to insert it here.
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await fetchProfile(data.user.id);
  return mapToAppUser(data.user, profile);
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

export const requestPasswordReset = async (email: string) => {
  // This intentionally applies to every Supabase Auth account, including the
  // super-admin account. Admin status does not bypass or disable recovery.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getSession();
  const authUser = data.session?.user;
  if (!authUser) return null;
  const profile = await fetchProfile(authUser.id);
  return mapToAppUser(authUser, profile);
};

/** Sends a one-time passcode to the given email via Supabase's built-in OTP email flow. */
export const sendOtp = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
};

export const verifyOtp = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  const profile = await fetchProfile(data.user!.id);
  return mapToAppUser(data.user, profile);
};
