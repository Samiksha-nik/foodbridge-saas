import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

const PUBLIC_PAGES = ['Landing', 'RoleSelection', 'Register', 'Login', 'ProviderRegistration', 'NGORegistration', 'OTPVerification', 'PendingApproval', 'forgot-password', 'reset-password/:token'];
const PROVIDER_PAGES = ['ProviderDashboard', 'AddDonation', 'MyDonations', 'ProviderAnalytics', 'ProviderRatings', 'DonationDetail', 'Profile'];
const NGO_PAGES = ['NGODashboard', 'NearbyFood', 'PickupSchedule', 'DeliveryHistory', 'NGOAnalytics', 'NGORatings', 'DonationDetail', 'Profile'];
const ADMIN_PAGES = ['AdminDashboard', 'UserManagement', 'DonationsMonitoring', 'NgoApprovals', 'FraudAlerts', 'AdminAnalytics'];

/**
 * Central auth guard: determines if current page can render and where to redirect.
 * Prevents redirect loops and guarantees a redirect target when needed.
 */
export function useAuthGuard(currentPageName) {
  const { user, isLoadingAuth } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  const result = useMemo(() => {
    const isPublic = PUBLIC_PAGES.includes(currentPageName);
    if (isPublic) return { canRender: true, redirectTo: null };

    if (isLoadingAuth) return { canRender: false, redirectTo: null };
    if (!user) return { canRender: false, redirectTo: createPageUrl('Landing') };

    if (!user.app_role) return { canRender: false, redirectTo: createPageUrl('RoleSelection') };

    const registrationPage = user.app_role === 'provider' ? 'ProviderRegistration' : 'NGORegistration';
    if (user.app_role && user.registration_completed === false && currentPageName !== registrationPage) {
      return { canRender: false, redirectTo: createPageUrl(registrationPage) };
    }
    if (user.registration_completed && user.email_verified === false && currentPageName !== 'OTPVerification') {
      return { canRender: false, redirectTo: createPageUrl('OTPVerification') };
    }
    if (user.app_role === 'ngo' && user.is_approved !== true && currentPageName !== 'PendingApproval') {
      return { canRender: false, redirectTo: createPageUrl('PendingApproval') };
    }
    if ((user.app_role === 'provider' || user.app_role === 'admin') && currentPageName === 'PendingApproval') {
      const dashboardPage = user.app_role === 'admin' ? 'AdminDashboard' : 'ProviderDashboard';
      return { canRender: false, redirectTo: createPageUrl(dashboardPage) };
    }

    if (user.app_role === 'provider' && (ADMIN_PAGES.includes(currentPageName) || (NGO_PAGES.includes(currentPageName) && !PROVIDER_PAGES.includes(currentPageName)))) {
      return { canRender: false, redirectTo: createPageUrl('ProviderDashboard') };
    }
    if (user.app_role === 'ngo' && (ADMIN_PAGES.includes(currentPageName) || (PROVIDER_PAGES.includes(currentPageName) && !NGO_PAGES.includes(currentPageName)))) {
      return { canRender: false, redirectTo: createPageUrl('NGODashboard') };
    }
    if (user.app_role === 'admin' && (PROVIDER_PAGES.includes(currentPageName) || NGO_PAGES.includes(currentPageName)) && currentPageName !== 'DonationDetail') {
      return { canRender: false, redirectTo: createPageUrl('AdminDashboard') };
    }

    return { canRender: true, redirectTo: null };
  }, [currentPageName, user, isLoadingAuth]);

  useEffect(() => {
    if (!result.redirectTo || redirecting) return;
    const currentPath = window.location.pathname;
    const targetPath = result.redirectTo.startsWith('/') ? result.redirectTo : `/${result.redirectTo}`;
    if (currentPath === targetPath) return;
    setRedirecting(true);
    try {
      window.location.href = result.redirectTo;
    } catch (e) {
      console.error('[useAuthGuard] redirect failed', e);
      setRedirecting(false);
    }
  }, [result.redirectTo, redirecting]);

  return { ...result, redirecting };
}
