import { Route, Router, Routes } from "react-router-dom";
import HomePage from "./pages/user/HomePage";
import About from "./pages/user/About";
import Setting from "./pages/user/setting";
import Profile from "./pages/user/setting/Profile";
import MainLayout from "./layouts/MainLayout";
import Account from "./pages/user/setting/Account";
import Social from "./pages/user/setting/Social";
import LoginTracking from "./pages/user/setting/LoginTracking";
import GuardRoute from "./components/GuardRoute";
import Address from "./pages/user/setting/Address";
import VerifyAccount from "./pages/user/VerifyAcount";
import Security from "./pages/user/setting/Security";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/about" element={<About />} />
        {/* setting */}
        <Route
          path="/setting"
          element={
            <GuardRoute requireAuth={true}>
              <Setting />
            </GuardRoute>
          }
        >
          <Route path="security">
            <Route index element={<Security />} />
            <Route path="password" element={<Account />} />
          </Route>
          <Route index path="profile" element={<Profile />} />
          <Route path="address" element={<Address />} />
          <Route path="social" element={<Social />} />
          <Route path="login-tracking" element={<LoginTracking />} />
        </Route>
      </Route>
      <Route
        path="/verify-account"
        element={
          <GuardRoute requireAuth={true} requireUnVerified={true}>
            <VerifyAccount />
          </GuardRoute>
        }
      />
    </Routes>
  );
}

export default App;
