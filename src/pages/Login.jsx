import { useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { useUserStore } from "@/stores/useUserStore";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { userProfile, initialized } = useUserStore();

  useEffect(() => {
    if (!initialized) return;
    if (!userProfile) return;

    if (
      userProfile.blocked ||
      userProfile.deleted === "deleted" ||
      userProfile.deleted === true
    ) {
      toast.error(
        userProfile.blocked
          ? "This account has been blocked by the admin."
          : "This account has been deleted by the admin."
      );
      (async () => {
        try {
          await auth.signOut();
        } catch (e) {
          console.log(e);
        }
      })();
      navigate("/login", { replace: true });
      return;
    }

    // If authenticated via Google and not admin, immediately sign out and return to login to prevent any route flicker.
    const isGoogleAuth = auth?.currentUser?.providerData?.some(
      (p) => p.providerId === "google.com"
    );

    if (isGoogleAuth && userProfile.role !== "admin") {
      toast.error("Only admin can login using Google!");
      (async () => {
        try {
          await auth.signOut();
        } catch (e) {
          console.log(e);
        } finally {
          navigate("/login", { replace: true });
        }
      })();
      return;
    }

    navigate(
      userProfile.role === "admin" || userProfile.role === "hr"
        ? "/admin"
        : "/dashboard"
    );
  }, [initialized, userProfile, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      const userDocRef = doc(db, "users", loggedInUser.uid);
      const docSnap = await getDoc(userDocRef);

      let userData = {};
      if (!docSnap.exists()) {
        // Create only if new AND is admin (or your logic)
        userData = {
          uid: loggedInUser.uid,
          displayName: loggedInUser.displayName,
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL,
          role: loggedInUser.role,
          active: true,
          createdAt: new Date(),
        };
        await setDoc(userDocRef, userData);
      } else {
        userData = docSnap.data();

        // 🔹 Immediately block non-admins BEFORE success toast/navigation
        if (userData.role !== "admin") {
          toast.error("Only admin can login using Google!");
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        await updateDoc(userDocRef, { active: true });
      }

      // 🔹 If code reaches here, the user is admin
      toast.success("Successfully logged in with Google!");
      navigate("/admin");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = result.user;

      const userDocRef = doc(db, "users", loggedInUser.uid);
      const docSnap = await getDoc(userDocRef);

      let userData = {};
      if (docSnap.exists()) {
        userData = docSnap.data();

        if (
          userData.blocked ||
          userData.deleted === "deleted" ||
          userData.deleted === true
        ) {
          toast.error(
            userData.blocked
              ? "Your account has been blocked by the admin."
              : "Your account has been deleted by the admin."
          );
          await auth.signOut();
          navigate("/login", { replace: true });
          return;
        }

        await updateDoc(userDocRef, { active: true });
      } else {
        userData = {
          uid: loggedInUser.uid,
          displayName: loggedInUser.displayName || "",
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL || "",
          active: true,
          createdAt: new Date(),
        };
        await setDoc(userDocRef, userData);
      }

      toast.success("Login successful!");
      navigate(userData.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      console.error("Email login error:", error);
      switch (error.code) {
        case "auth/invalid-email":
          toast.error("Invalid email address.");
          break;
        case "auth/user-not-found":
          toast.error("No account found with this email.");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password.");
          break;
        default:
          toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email to reset password.");
      return;
    }
    try {
      setIsResetLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (error) {
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address.");
          break;
        default:
          toast.error("Could not send reset email.");
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex items-center justify-center min-h-screen  px-4">
        <Card className="w-full max-w-md shadow-lg border">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Login to your account to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResetLoading}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {isResetLoading ? "Sending..." : "Forgot password?"}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1 border-t" />
              <span className="text-xs text-gray-400">OR</span>
              <span className="flex-1 border-t" />
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Icon icon="flat-color-icons:google" width="20" height="20" />
              Continue with Google
            </Button>

            {/* <p className="text-sm text-center text-gray-500">
              Don’t have an account?{" "}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </p> */}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default Login;
