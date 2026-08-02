import Header from "./Header";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";
import { LocationProvider } from "../contexts/LocationContext";
import LocationSearchModal from "../components/LocationSearchModal";
import PageBreadcrumb from "../components/PageBreadcrumb";

function MainLayout() {
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith("/messages");

  return (
    <LocationProvider>
      <div className="flex min-h-screen flex-col bg-gray-100">
        <LocationSearchModal />
        <Header />
        <main className="flex-1">
          <PageBreadcrumb />
          <Outlet />
        </main>
        {!isMessagesPage && <Footer />}
      </div>
    </LocationProvider>
  );
}

export default MainLayout;
