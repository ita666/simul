import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import Compare from "./pages/Compare";
import Premium from "./pages/Premium";
import VariableRate from "./pages/VariableRate";
import Optimization from "./pages/Optimization";
import Investment from "./pages/Investment";
import "./index.css";
import "./i18n";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/compare", element: <Compare /> },
      { path: "/premium", element: <Premium /> },
      { path: "/variable-rate", element: <VariableRate /> },
      { path: "/optimization", element: <Optimization /> },
      { path: "/investment", element: <Investment /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);