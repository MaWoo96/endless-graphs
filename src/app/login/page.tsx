"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { BlurText } from "@/components/reactbits";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        setError("Check your email for the confirmation link!");
        setIsLoading(false);
        return;
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        setError("Check your email for the password reset link!");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          {/* Endless Winning Logo */}
          <div className="mb-6 flex justify-center">
            {/* Light mode - use Builder.io CDN logo */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F4ad978e0688d4dda812918cce1ce678d%2F94a75958efc14f22bc98c3a7ab307dbb?format=webp&width=800"
              alt="Endless Winning Logo"
              className="w-24 h-24 drop-shadow-lg block dark:hidden"
              style={{
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            />
            {/* Dark mode - use local white logo */}
            <img
              src="/logo-dark.png"
              alt="Endless Winning Logo"
              className="w-24 h-24 drop-shadow-lg hidden dark:block"
              style={{
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            />
          </div>

          {/* Endless Winning Title with Brand Gradient (Navy → Teal) */}
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

          {/* Tagline with BlurText */}
          <div
            style={{
              animation: "fadeInUp 0.6s ease-out 0.2s forwards",
              opacity: 0,
            }}
          >
            <BlurText
              text="Close the Gap. Where you are → Where you're called to be."
              className="text-navy-medium dark:text-gray-400 text-sm"
              delay={100}
              animateBy="words"
            />
          </div>
        </div>

        {/* Form Card with Outer Glow Effect */}
        <div
          className="group relative"
          style={{
            animation: "fadeInUp 0.6s ease-out 0.3s forwards",
            opacity: 0,
          }}
        >
          {/* Outer glow effect only - no fill, just blur behind */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300 -z-10 scale-110" />

          {/* Clean white card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/50 border border-transparent dark:border-gray-800 relative">
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm text-gray dark:text-gray-400 hover:text-navy-medium dark:hover:text-gray-300 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            )}
            <h2 className="text-xl font-semibold text-navy-dark dark:text-white mb-2 text-center">
              {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
            </h2>
            <p className="text-gray dark:text-gray-400 text-sm text-center mb-6">
              {mode === "login"
                ? "Sign in to access your dashboard"
                : mode === "signup"
                ? "Get started with Endless Winning"
                : "Enter your email to receive a reset link"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-navy-dark dark:text-gray-200 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray dark:text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-off-white dark:bg-gray-800 border border-gray/30 dark:border-gray-700 rounded-xl text-navy-dark dark:text-white placeholder-gray dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field - Hidden in forgot mode */}
              {mode !== "forgot" && (
                <div>
                  <label className="block text-sm font-medium text-navy-dark dark:text-gray-200 mb-1.5">
                    Password
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
              )}

              {/* Error Message */}
              {error && (
                <div
                  className={`p-3 rounded-xl text-sm ${
                    error.includes("Check your email")
                      ? "bg-teal/10 border border-teal/20 text-navy-medium"
                      : "bg-loss-red/10 border border-loss-red/20 text-loss-red"
                  }`}
                >
                  {error}
                </div>
              )}

              {/* Submit Button - Brand CTA Gradient (Purple → Pink) */}
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
                    {mode === "login" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending link..."}
                  </>
                ) : mode === "login" ? (
                  "Sign In"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            {mode !== "forgot" && (
              <div className="mt-6 pt-6 border-t border-gray/20 dark:border-gray-700 text-center space-y-3">
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                    }}
                    className="text-gray dark:text-gray-400 text-sm hover:text-navy-medium dark:hover:text-gray-300 transition-colors"
                  >
                    Forgot your password?
                  </button>
                )}
                <p className="text-gray dark:text-gray-400 text-sm">
                  {mode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
                  <button
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError(null);
                    }}
                    className="text-teal hover:text-navy-medium dark:hover:text-teal/80 transition-colors font-medium"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
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
