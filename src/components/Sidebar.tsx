import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MessageCircle,
  GraduationCap,
  Sparkles,
  LogOut,
  Menu,
  X,
  BookOpen,
  Target,
  Map,
} from "lucide-react";
import { XPProgressBar } from "@/components/XPProgressBar";
import { useLearningProfile } from "@/hooks/use-learning-profile";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { profile } = useLearningProfile();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isActive = (route: string) => {
    if (route === "/dashboard") return path === "/dashboard";
    return path.startsWith(route);
  };

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
      active
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
    }`;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Sparkles, label: "Quiz", href: "/quiz" },
    { icon: Map, label: "Learn", href: "/learn" },
    { icon: GraduationCap, label: "Library", href: "/library" },
    { icon: MessageCircle, label: "AI Tutor", href: "/tutor" },
    { icon: Target, label: "Coach Amaka", href: "/coach" },
  ];

  const handleNavClick = (href: string) => {
    nav({ to: href });
    if (isMobile) setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border/60 shadow-xl transition-transform duration-300 z-40 flex flex-col ${
          isOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border/60">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-hero shadow-glow">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold">Naija</span>
            <span className="text-primary font-bold text-xs">Tutor</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={linkCls(active)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* XP Bar */}
        {profile && (
          <div className="px-4 pb-3">
            <XPProgressBar profile={profile} compact />
          </div>
        )}

        {/* User Section */}
        <div className="border-t border-border/60 p-4 space-y-3">
          <div className="px-4 py-3 rounded-lg bg-secondary/50">
            <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
            <p className="text-sm font-bold text-foreground truncate mt-1">
              {(user?.user_metadata?.full_name as string) || user?.email}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              await signOut();
              nav({ to: "/" });
            }}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
