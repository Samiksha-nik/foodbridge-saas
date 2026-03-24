import React, { createContext, useState, useContext, useEffect } from "react";
import * as authApi from "@/api/authApi";

const AuthContext = createContext(null);

function mapBackendUserToFrontend(backendUser) {
  if (!backendUser) return null;
  return {
    id: backendUser.id,
    email: backendUser.email,
    app_role: backendUser.role,
    email_verified: backendUser.isVerified,
    registration_completed: backendUser.registrationCompleted,
    is_approved: backendUser.isApproved,
    full_name: backendUser.fullName,
    organization_name: backendUser.organizationName,
    profile_image: backendUser.profileImage,
    organization_type: backendUser.organizationType,
    license_number: backendUser.licenseNumber,
    phone: backendUser.phone,
    address: backendUser.address,
    bio: backendUser.bio,
    pickup_start_time: backendUser.pickupStartTime,
    pickup_end_time: backendUser.pickupEndTime,
    preferred_contact_method: backendUser.preferredContactMethod,
    ngo_name: backendUser.ngoName,
    ngo_phone: backendUser.ngoPhone,
    ngo_address: backendUser.ngoAddress,
    ngo_description: backendUser.ngoDescription,
    ngo_profile_image: backendUser.ngoProfileImage,
    registration_id: backendUser.registrationId,
    established_year: backendUser.establishedYear,
    ngo_type: backendUser.ngoType,
    mission: backendUser.mission,
    website: backendUser.website,
    social_links: backendUser.socialLinks,
    daily_capacity: backendUser.dailyCapacity,
    capacity_utilization: backendUser.capacityUtilization,
    storage_available: backendUser.storageAvailable,
    cold_storage_available: backendUser.coldStorageAvailable,
    pickup_radius: backendUser.pickupRadius,
    ngo_pickup_start_time: backendUser.ngoPickupStartTime,
    ngo_pickup_end_time: backendUser.ngoPickupEndTime,
    emergency_available: backendUser.emergencyAvailable,
    location: backendUser.location,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setAuthError(null);
      setIsLoadingPublicSettings(false);
      try {
        const backendUser = await authApi.getMe();
        if (!cancelled) {
          setUser(mapBackendUserToFrontend(backendUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Backend auth check failed:", err);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setIsLoadingAuth(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const backendUser = await authApi.getMe();
      setUser(mapBackendUserToFrontend(backendUser));
      setIsAuthenticated(true);
    } catch (error) {
      console.error("User auth check failed:", error);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: "auth_required",
          message: "Authentication required",
        });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (shouldRedirect) {
        window.location.href = "/";
      }
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/";
  };

  const checkAppState = () => {
    setIsLoadingPublicSettings(false);
    setAuthError(null);
    checkUserAuth().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
