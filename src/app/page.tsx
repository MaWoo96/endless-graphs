"use client";

import { BarChart3, Receipt, FileText, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useClientData";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LinkItem {
  label: string;
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const links: LinkItem[] = [
  {
    label: "Endless Graphs",
    url: "/graphs",
    icon: BarChart3,
    description: "Financial dashboards & analytics",
  },
  {
    label: "Receipts",
    url: "/receipts",
    icon: Receipt,
    description: "Upload & manage receipts",
  },
  {
    label: "Reporting",
    url: "/reporting",
    icon: FileText,
    description: "Generate financial reports",
  },
];

export default function MenuPage() {
  const { user, isSigningOut, signOut } = useUser();

  return (
    <div className="min-h-screen bg-off-white dark:bg-gray-950 flex flex-col items-center justify-center px-6 md:px-12 py-12 md:py-24 transition-colors">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Radial gradient background effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, rgba(138, 178, 181, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            {/* Light mode logo */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F4ad978e0688d4dda812918cce1ce678d%2F94a75958efc14f22bc98c3a7ab307dbb?format=webp&width=800"
              alt="Endless Winning Logo"
              className="w-24 h-24 drop-shadow-lg block dark:hidden"
            />
            {/* Dark mode logo */}
            <img
              src="/logo-dark.png"
              alt="Endless Winning Logo"
              className="w-24 h-24 drop-shadow-lg hidden dark:block"
            />
          </div>

          {/* Company Name with Gradient Text */}
          <h1
            className="text-4xl font-bold mb-3"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #2F4F6A 0%, #8AB2B5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Endless Winning
          </h1>

          {/* Tagline */}
          <p className="text-navy-medium dark:text-gray-400 text-sm leading-relaxed">
            Close the Gap. Where you are → Where you&apos;re called to be.
          </p>
        </div>

        {/* Link Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {links.map((link, index) => {
            const Icon = link.icon;
            return (
              <Link
                key={index}
                href={link.url}
                className="group relative h-40"
                style={{
                  animation: `fadeInUp 0.5s ease-out forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                }}
              >
                {/* Glow effect backdrop */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-300 -z-10 scale-110" />

                <div className="relative w-full h-full bg-white dark:bg-gray-900 text-navy-dark dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl dark:shadow-gray-900/50 transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden flex flex-col items-center justify-center text-center border border-transparent dark:border-gray-800">
                  {/* Content */}
                  <div className="relative flex flex-col items-center justify-center gap-3">
                    <Icon size={40} className="text-teal transition-colors duration-300" />
                    <span className="font-semibold text-base transition-colors duration-300">
                      {link.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                      {link.description}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Info & Sign Out */}
        {user && (
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
            <button
              onClick={signOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-loss-red transition-colors disabled:opacity-50"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Powered by{" "}
            <span className="text-teal font-semibold">Endless Winning</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
