import { Outlet } from "react-router-dom";

function UserPage() {
  return (
    <div className="font-extralight text-gray-800 bg-[#f4f5f5] overflow-hidden text-[1.4rem] md:text-[1.6rem] ">
      <Outlet />
    </div>
  );
}

export default UserPage;
