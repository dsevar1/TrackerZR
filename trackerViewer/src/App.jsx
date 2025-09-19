import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Details from "./pages/Details.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/details/:uuid/:date" element={<Details />} />
    </Routes>
  );
}
