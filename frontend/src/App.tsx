import { Route, Routes } from "react-router-dom";
import UserPage from "./pages/user";
import HomePage from "./pages/user/HomePage";
import About from "./pages/user/About";

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserPage />}>
        <Route index element={<HomePage />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default App;
