import "./App.css";
import LoginPage from "./components/LoginPage";
import { Route, Routes } from "react-router";
import SignupPage from "./components/SignupPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

export default App;
