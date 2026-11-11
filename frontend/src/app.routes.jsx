import { createBrowserRouter } from "react-router";
import AppLayout from "./features/common/components/AppLayout";
import Protected from "./features/auth/components/protected";
import Home from "./features/interview/pages/Home";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Interview from "./features/interview/pages/Interview";
import NotFound from "./features/common/pages/NotFound";
import PrivacyPolicy from "./features/common/pages/PrivacyPolicy";
import TermsOfService from "./features/common/pages/TermsOfService";
import HelpCenter from "./features/common/pages/HelpCenter";

export const router = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            {
                path: "/login", element: <Login />
            },
            {
                path: "/register", element: <Register />
            },
            {
                path: "/", element: <Protected><Home /></Protected>
            },
            {
                path: "/interview/:interviewId", element: <Protected><Interview /></Protected>
            },
            {
                path: "/privacy", element: <PrivacyPolicy />
            },
            {
                path: "/terms", element: <TermsOfService />
            },
            {
                path: "/help", element: <HelpCenter />
            },
            {
                path: "*", element: <NotFound />
            }
        ]
    }
]);
