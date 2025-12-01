"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { BlurText } from "@/components/reactbits";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Check if user has a valid session (from the reset link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session means the reset link is invalid or expired
        router.push("/login?error=invalid_reset_link");
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white dark:bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Subtle radial gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, rgba(138, 178, 181, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            {/* Light mode logo */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F4ad978e0688d4dda812918cce1ce678d%2F94a75958efc14f22bc98c3a7ab307dbb?format=webp&width=800"
              alt="Endless Winning Logo"
              className="w-24 h-24 drop-shadow-lg block dark:hidden"
              style={{
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            />
            {/* Dark mode logo */}
            <img
              src="/logo-dark.png"
              alt="Endless Winning Logo"
              className="w-24 h-24 drop-shadow-lg hidden dark:block"
              style={{
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            />
          </div>

          <h1
            className="text-4xl font-bold mb-3"
            style={{
              backgroundImage: "linear-gradient(135deg, #2F4F6A 0%, #8AB2B5 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "fadeInUp 0.6s ease-out 0.1s forwards",
              opacity: 0,
            }}
          >
            Endless Winning
          </h1>

          <div
            style={{
              animation: "fadeInUp 0.6s ease-out 0.2s forwards",
              opacity: 0,
            }}
          >
            <BlurText
              text="Create your new password"
              className="text-navy-medium dark:text-gray-400 text-sm"
              delay={100}
              animateBy="words"
            />
          </div>
        </div>

        {/* Form Card */}
        <div
          className="group relative"
          style={{
            animation: "fadeInUp 0.6s ease-out 0.3s forwards",
            opacity: 0,
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300 -z-10 scale-110" />

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/50 border border-transparent dark:border-gray-800 relative">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-teal mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-navy-dark dark:text-white mb-2">
                  Password Updated!
                </h2>
                <p className="text-gray dark:text-gray-400 text-sm">
                  Redirecting you to the dashboard...
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-navy-dark dark:text-white mb-2 text-center">
                  Update Password
                </h2>
                <p className="text-gray dark:text-gray-400 text-sm text-center mb-6">
                  Enter your new password below
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-navy-dark dark:text-gray-200 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray dark:text-gray-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-off-white dark:bg-gray-800 border border-gray/30 dark:border-gray-700 rounded-xl text-navy-dark dark:text-white placeholder-gray dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray dark:text-gray-500 hover:text-navy-medium dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-navy-dark dark:text-gray-200 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray dark:text-gray-500" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 bg-off-white dark:bg-gray-800 border border-gray/30 dark:border-gray-700 rounded-xl text-navy-dark dark:text-white placeholder-gray dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray dark:text-gray-500 hover:text-navy-medium dark:hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-xl text-sm bg-loss-red/10 border border-loss-red/20 text-loss-red">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #5856d6 0%, #ff2d92 100%)",
                      boxShadow: "0 4px 14px rgba(88, 86, 214, 0.3)",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p
          className="text-center text-gray dark:text-gray-500 text-xs mt-8"
          style={{
            animation: "fadeInUp 0.6s ease-out 0.4s forwards",
            opacity: 0,
          }}
        >
          Powered by{" "}
          <span className="text-teal font-semibold">Endless Winning</span>
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
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
