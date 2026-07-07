import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/user/HomePage";
import About from "./pages/user/About";
import Setting from "./pages/user/setting";
import Profile from "./pages/user/setting/Profile";
import MainLayout from "./layouts/MainLayout";
import Account from "./pages/user/setting/Account";
import LoginTracking from "./pages/user/setting/LoginTracking";
import GuardRoute from "./components/guards/GuardRoute";
import Address from "./pages/user/setting/Address";
import Security from "./pages/user/setting/Security";
import VerifyOtp from "./pages/user/VerifyOtp";
import SessionGuard from "./components/guards/SessionGuard";
import ResetPassword from "./pages/user/ResetPassword";
import SaveListing from "./pages/user/setting/SaveListing";
import PublicProfile from "./pages/user/PublicProfile";
import Contact from "./pages/user/Contact";
import Messages from "./pages/user/Messages";
import CreatePost from "./pages/user/Post/CreatePost";
import ManagePosts from "./pages/user/Post/ManagePosts";
import PostDetail from "./pages/user/Post/PostDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
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
        <Route path="/users/:id" element={<PublicProfile />} />
        <Route path="/posts/:slug" element={<PostDetail />} />
        <Route
          path="/posts/:slug/edit"
          element={
            <GuardRoute requireAuth={true}>
              <CreatePost />
            </GuardRoute>
          }
        />
        <Route
          path="/posts/create"
          element={
            <GuardRoute requireAuth={true}>
              <CreatePost />
            </GuardRoute>
          }
        />
        <Route
          path="/posts/manage"
          element={
            <GuardRoute requireAuth={true}>
              <ManagePosts />
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
          <Route path="save-listing" element={<SaveListing />} />
          <Route path="login-tracking" element={<LoginTracking />} />
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
    </Routes>
  );
}

export default App;
