import Header from "./Header";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";

function MainLayout() {
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith("/messages");

  return (
    <div className="bg-gray-100">
      <Header />
      <main>
        <Outlet />
      </main>
      {!isMessagesPage && <Footer />}
    </div>
  );
}

export default MainLayout;
