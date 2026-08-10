import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/user/HomePage";
import VehicleSearchPage from "./pages/user/VehicleSearchPage";
import About from "./pages/user/About";
import Setting from "./pages/user/setting";
import Profile from "./pages/user/setting/Profile";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import Account from "./pages/user/setting/Account";
import LoginTracking from "./pages/user/setting/LoginTracking";
import GuardRoute from "./components/guards/GuardRoute";
import Address from "./pages/user/setting/Address";
import Security from "./pages/user/setting/Security";
import VerifyOtp from "./pages/user/VerifyOtp";
import SessionGuard from "./components/guards/SessionGuard";
import ResetPassword from "./pages/user/ResetPassword";
import SaveListing from "./pages/user/SaveListing";
import PublicProfile from "./pages/user/PublicProfile";
import Contact from "./pages/user/Contact";
import Messages from "./pages/user/Messages";
import Notifications from "./pages/user/Notifications";
import CreatePost from "./pages/user/Post/CreatePost";
import ManagePosts from "./pages/user/Post/ManagePosts";
import PostDetail from "./pages/user/Post/PostDetail";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminCatalog from "./pages/admin/AdminCatalog";
import Dashboard from "./pages/admin/Dashboard";
import PendingPosts from "./pages/admin/PendingPosts";
import PostReview from "./pages/admin/PostReview";
import { UserRole } from "./shared";
import { useUser } from "./hooks/useUser";
import ViewHistory from "./pages/user/ViewHistory";
import ProfessionalSeller from "./pages/user/setting/ProfessionalSeller";
import StorePage from "./pages/user/StorePage";
import AdminProfessionalSellers from "./pages/admin/AdminProfessionalSellers";
import ListingPaymentResult from "./pages/user/ListingPaymentResult";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminTransactions from "./pages/admin/AdminTransactions";
import IdentityVerification from "./pages/user/setting/IdentityVerification";
import AdminIdentityVerifications from "./pages/admin/AdminIdentityVerifications";
import PromotionPlans from "./pages/user/Post/PromotionPlans";
import AdminMonetization from "./pages/admin/AdminMonetization";
import AdminReports from "./pages/admin/AdminReports";
import SellerPlans from "./pages/user/setting/SellerPlans";
import ListingPayment from "./pages/user/ListingPayment";
import TransactionHistory from "./pages/user/TransactionHistory";
import MyReports from "./pages/user/MyReports";

const adminRoles = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.CSKH];
const postReviewRoles = [UserRole.ADMIN, UserRole.MODERATOR];

function AdminIndexRedirect() {
  const { user } = useUser();

  return (
    <Navigate
      to={
        user?.role === UserRole.MODERATOR
          ? "posts/pending"
          : user?.role === UserRole.CSKH
            ? "notifications"
            : "dashboard"
      }
      replace
    />
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuardRoute area="customer">
            <MainLayout />
          </GuardRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="/vehicles" element={<VehicleSearchPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/messages"
          element={
            <GuardRoute requireAuth={true}>
              <Messages />
            </GuardRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <GuardRoute requireAuth={true}>
              <Notifications />
            </GuardRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <MyReports />
            </GuardRoute>
          }
        />
        <Route path="/users/:id" element={<PublicProfile />} />
        <Route path="/stores/:id" element={<StorePage />} />
        <Route path="/posts/:slug" element={<PostDetail />} />
        <Route
          path="/history"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <ViewHistory />
            </GuardRoute>
          }
        />
        <Route
          path="/saved-listings"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <SaveListing />
            </GuardRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <ListingPayment />
            </GuardRoute>
          }
        />
        <Route
          path="/payment-result"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <ListingPaymentResult />
            </GuardRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <TransactionHistory />
            </GuardRoute>
          }
        />
        <Route
          path="/posts/:id/promotions"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <PromotionPlans />
            </GuardRoute>
          }
        />
        <Route
          path="/posts/:slug/edit"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <CreatePost />
            </GuardRoute>
          }
        />
        <Route
          path="/posts/create"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <CreatePost />
            </GuardRoute>
          }
        />
        <Route
          path="/posts/manage"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <ManagePosts />
            </GuardRoute>
          }
        />
        <Route
          path="/seller/plans"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.USER]}>
              <SellerPlans />
            </GuardRoute>
          }
        />
        <Route
          path="/setting"
          element={
            <GuardRoute requireAuth={true}>
              <Setting />
            </GuardRoute>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="security">
            <Route index element={<Security />} />
            <Route path="password" element={<Account />} />
          </Route>
          <Route path="profile" element={<Profile />} />
          <Route path="address" element={<Address />} />
          <Route
            path="save-listing"
            element={<Navigate to="/saved-listings" replace />}
          />
          <Route path="login-tracking" element={<LoginTracking />} />
          <Route path="professional-seller" element={<ProfessionalSeller />} />
          <Route
            path="seller-plans"
            element={<Navigate to="/seller/plans" replace />}
          />
          <Route path="identity-verification" element={<IdentityVerification />} />
        </Route>
      </Route>
      <Route
        path="/verify-otp"
        element={
          <GuardRoute requireAuth={true} requireUnVerified={true}>
            <VerifyOtp />
          </GuardRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <SessionGuard sessionKey="resetEmail">
            <ResetPassword />
          </SessionGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <GuardRoute
            requireAuth={true}
            roles={adminRoles}
            area="admin"
          >
            <AdminLayout />
          </GuardRoute>
        }
      >
        <Route index element={<AdminIndexRedirect />} />
        <Route
          path="dashboard"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <Dashboard />
            </GuardRoute>
          }
        />
        <Route
          path="monetization"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminMonetization />
            </GuardRoute>
          }
        />
        <Route
          path="posts"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminPosts />
            </GuardRoute>
          }
        />
        <Route
          path="staff"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminStaff />
            </GuardRoute>
          }
        />
        <Route
          path="users"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminUsers />
            </GuardRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminUserDetail />
            </GuardRoute>
          }
        />
        <Route
          path="catalog"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminCatalog />
            </GuardRoute>
          }
        />
        <Route
          path="professional-sellers"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminProfessionalSellers />
            </GuardRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminTransactions />
            </GuardRoute>
          }
        />
        <Route
          path="revenue"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminRevenue />
            </GuardRoute>
          }
        />
        <Route
          path="identity-verifications"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN]}>
              <AdminIdentityVerifications />
            </GuardRoute>
          }
        />
        <Route
          path="reports"
          element={
            <GuardRoute requireAuth={true} roles={[UserRole.ADMIN, UserRole.CSKH]}>
              <AdminReports />
            </GuardRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <GuardRoute
              requireAuth={true}
              roles={adminRoles}
              area="admin"
            >
              <AdminNotifications />
            </GuardRoute>
          }
        />
        <Route
          path="messages"
          element={
            <GuardRoute
              requireAuth={true}
              roles={adminRoles}
              area="admin"
            >
              <AdminMessages />
            </GuardRoute>
          }
        />
        <Route
          path="posts/pending"
          element={
            <GuardRoute
              requireAuth={true}
              roles={postReviewRoles}
              area="admin"
            >
              <PendingPosts />
            </GuardRoute>
          }
        />
        <Route
          path="posts/pending/:slug"
          element={
            <GuardRoute
              requireAuth={true}
              roles={postReviewRoles}
              area="admin"
            >
              <PostReview />
            </GuardRoute>
          }
        />
        <Route
          path="posts/view/:slug"
          element={
            <GuardRoute
              requireAuth={true}
              roles={[UserRole.ADMIN, UserRole.MODERATOR, UserRole.CSKH]}
              area="admin"
            >
              <PostReview readOnly />
            </GuardRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
