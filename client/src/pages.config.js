/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Landing from './pages/Landing';
import RoleSelection from './pages/RoleSelection';
import ProviderDashboard from './pages/ProviderDashboard';
import AddDonation from './pages/AddDonation';
import MyDonations from './pages/MyDonations';
import DonationDetail from './pages/DonationDetail';
import ProviderAnalytics from './pages/ProviderAnalytics';
import ProviderRatings from './pages/ProviderRatings';
import NGODashboard from './pages/NGODashboard';
import NearbyFood from './pages/NearbyFood';
import PickupSchedule from './pages/PickupSchedule';
import DeliveryHistory from './pages/DeliveryHistory';
import NGOAnalytics from './pages/NGOAnalytics';
import NGORatings from './pages/NGORatings';
import AdminDashboard from './pages/AdminDashboard';
import NgoApprovals from './pages/admin/NgoApprovals';
import UserManagement from './pages/UserManagement';
import DonationsMonitoring from './pages/DonationsMonitoring';
import FraudAlerts from './pages/FraudAlerts';
import AdminAnalytics from './pages/AdminAnalytics';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import ProviderRegistration from './pages/ProviderRegistration';
import NGORegistration from './pages/NGORegistration';
import OTPVerification from './pages/OTPVerification';
import PendingApproval from './pages/PendingApproval';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NgoProfile from './pages/NgoProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "RoleSelection": RoleSelection,
    "ProviderDashboard": ProviderDashboard,
    "AddDonation": AddDonation,
    "MyDonations": MyDonations,
    "DonationDetail": DonationDetail,
    "ProviderAnalytics": ProviderAnalytics,
    "ProviderRatings": ProviderRatings,
    "NGODashboard": NGODashboard,
    "NearbyFood": NearbyFood,
    "PickupSchedule": PickupSchedule,
    "DeliveryHistory": DeliveryHistory,
    "NGOAnalytics": NGOAnalytics,
    "NGORatings": NGORatings,
    "AdminDashboard": AdminDashboard,
    "NgoApprovals": NgoApprovals,
    "admin/ngos": NgoApprovals,
    "admin": AdminDashboard,
    "provider": ProviderDashboard,
    "ngo": NGODashboard,
    "UserManagement": UserManagement,
    "DonationsMonitoring": DonationsMonitoring,
    "FraudAlerts": FraudAlerts,
    "AdminAnalytics": AdminAnalytics,
    "Profile": Profile,
    "Register": Register,
    "Login": Login,
    "ProviderRegistration": ProviderRegistration,
    "NGORegistration": NGORegistration,
    "OTPVerification": OTPVerification,
    "PendingApproval": PendingApproval,
    "forgot-password": ForgotPassword,
    "reset-password/:token": ResetPassword,
    "NgoProfile": NgoProfile,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};