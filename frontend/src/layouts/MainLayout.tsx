import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div className="bg-gray-100">
      <Header />
      <main className="h-[180rem]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
