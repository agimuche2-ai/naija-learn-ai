import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/Sidebar";
import { LearningProfileProvider, useLearningProfile } from "@/hooks/use-learning-profile";
import { LearningStyleOnboarding } from "@/components/LearningStyleOnboarding";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayoutWrapper,
});

// Wrap with provider so Sidebar (which uses useLearningProfile) has access
function AppLayoutWrapper() {
  return (
    <LearningProfileProvider>
      <AppLayout />
    </LearningProfileProvider>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useLearningProfile();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show onboarding modal for first-time users */}
      {!profileLoading && profile && !profile.onboarding_done && (
        <LearningStyleOnboarding />
      )}
      <Sidebar />
      <main className="md:ml-64 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}