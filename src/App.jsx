import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import ChangePassword from "./components/ChangePassword";
import Policy from "./pages/Policy";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route path="/profile" element={<h2>Profile Page</h2>} />
        {/* <Route path="/profile/:id" element={<Profile />} /> */}
        <Route path="/change-password" element={<ChangePassword />} />
         <Route path="/policy" element={<Policy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
