import { createBrowserRouter } from "react-router-dom";
import { RegisterPage } from "./pages/RegisterPage";
import { CompletePage } from "./pages/CompletePage";
import { DisplayPage } from "./pages/DisplayPage";

export const router = createBrowserRouter([
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/register/complete",
    Component: CompletePage,
  },
  {
    path: "/display",
    Component: DisplayPage,
  },
  {
    path: "/",
    Component: DisplayPage,
  },
]);
