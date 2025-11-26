import { useAuth } from "@/components/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading, onboardingCompleted } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is logged in but hasn't completed onboarding, and is not already on the onboarding page
    if (!onboardingCompleted && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace />;
    }

    // If user has completed onboarding and tries to access onboarding page, redirect to dashboard
    if (onboardingCompleted && location.pathname === "/onboarding") {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
