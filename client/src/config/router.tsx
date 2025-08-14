import {createBrowserRouter} from "react-router-dom";
import {ROUTES} from "@/constants/routes.ts";
import Landing from "@/views/landing.tsx";

export const ROUTER = createBrowserRouter([
    {
        path: ROUTES.landing,
        element: <Landing />
    }
])