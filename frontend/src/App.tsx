import { BrowserRouter, Route, Routes } from "react-router";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import ChatApp from "./pages/ChatApp";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import { useThemeStore } from "./stores/useThemeStore";
import { useEffect } from "react";
import { useSocketStore } from "./stores/useSocketStore";
import { useAuthStore } from "./stores/useAuthStore";

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }
    return () => disconnectSocket();
  }, [accessToken]);
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />

          {/* private */}

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatApp />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
