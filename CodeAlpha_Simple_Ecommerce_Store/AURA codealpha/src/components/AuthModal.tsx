import React, { useState } from "react";
import { X, Lock, Mail, User, ShieldAlert, Loader2, Sparkles } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, fullName: string) => Promise<void>;
  onGoogleLogin?: () => Promise<void>;
}

export default function AuthModal({ onClose, onLogin, onRegister, onGoogleLogin }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleClick = async () => {
    if (!onGoogleLogin) return;
    setError("");
    setLoading(true);
    try {
      await onGoogleLogin();
      onClose();
    } catch (err: any) {
      console.warn("[AuthModal] Google login response:", err);
      const code = err?.code || "";
      const msg = err?.message || "";
      if (code === "auth/operation-not-allowed" || msg.includes("auth/operation-not-allowed")) {
        setError("Google Sign-In is not enabled for this Firebase project. Please enable it in the Firebase console.");
      } else if (code === "auth/invalid-credential" || msg.includes("auth/invalid-credential")) {
        setError("Invalid credential or authentication request was cancelled. Please try again.");
      } else if (code === "auth/popup-closed-by-user" || msg.includes("auth/popup-closed-by-user")) {
        setError("Sign-in popup window was closed. Please try signing in again.");
      } else if (code === "auth/unauthorized-domain" || msg.includes("auth/unauthorized-domain")) {
        setError("This domain is not authorized for OAuth in Firebase Console.");
      } else {
        setError(msg || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanPassword || (isSignUp && !cleanName)) {
      setError("Please fill out all required fields.");
      return;
    }
    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await onRegister(cleanEmail, cleanPassword, cleanName);
      } else {
        await onLogin(cleanEmail, cleanPassword);
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      console.warn("[AuthModal] Sign-in/Register note:", err);
      const code = err?.code || "";
      const msg = err?.message || "";
      
      // Clean up Firebase Auth errors
      if (code === "auth/email-already-in-use" || msg.includes("auth/email-already-in-use")) {
        setError("This email address is already registered. Please click 'Sign In' below.");
      } else if (
        code === "auth/invalid-credential" ||
        msg.includes("auth/invalid-credential") ||
        code === "auth/wrong-password" ||
        msg.includes("auth/wrong-password") ||
        code === "auth/user-not-found" ||
        msg.includes("auth/user-not-found")
      ) {
        if (!isSignUp) {
          setError("Incorrect password or account not found. If you haven't created an account yet, please click 'Register a Free Account' below.");
        } else {
          setError("Invalid credentials entered. Please verify your email and password.");
        }
      } else if (code === "auth/invalid-email" || msg.includes("auth/invalid-email")) {
        setError("Please enter a valid email address without extra spaces.");
      } else if (code === "auth/weak-password" || msg.includes("auth/weak-password")) {
        setError("Password should be at least 6 characters long.");
      } else if (code === "auth/operation-not-allowed" || msg.includes("auth/operation-not-allowed")) {
        setError("Email/Password authentication is disabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.");
      } else {
        setError(msg || "An authentication error occurred. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" id="auth-modal">
      {/* Background click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 flex flex-col justify-center animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-950 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            {isSignUp ? "Create Your AURA Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isSignUp
              ? "Register to save custom profiles, delivery details and orders"
              : "Access your saved shipping profiles and active order listings"}
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className="flex flex-col gap-2 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 mb-6">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {!isSignUp && error.includes("Register a Free Account") && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                }}
                className="mt-1 self-start px-3 py-1 bg-red-600 text-white hover:bg-red-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Switch to Register Account
              </button>
            )}
            {isSignUp && error.includes("Sign In") && (
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                }}
                className="mt-1 self-start px-3 py-1 bg-red-600 text-white hover:bg-red-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Switch to Sign In
              </button>
            )}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="E.g., Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#0a4436] text-white hover:bg-[#073228] disabled:bg-slate-100 disabled:text-slate-400 rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 mt-6 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Authorization...</span>
              </>
            ) : (
              <span>{isSignUp ? "Complete Account Creation" : "Sign In Successfully"}</span>
            )}
          </button>
        </form>

        {onGoogleLogin && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-white px-3 text-slate-400">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleClick}
              disabled={loading}
              type="button"
              className="w-full h-12 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {/* Footer / Toggle Mode */}
        <div className="text-center mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            {isSignUp ? "Already have an account?" : "New to AURA?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-bold text-blue-600 hover:text-blue-800 focus:outline-none ml-1 transition-colors"
            >
              {isSignUp ? "Sign In" : "Register a Free Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
