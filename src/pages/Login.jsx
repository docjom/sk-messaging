import { useState } from "react";
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
  CardAction,
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

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          active: true,
          createdAt: new Date(),
        });
      } else {
        await updateDoc(userDocRef, { active: true });
      }

      toast.success("Successfully logged in with Google!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to login with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        await updateDoc(userDocRef, { active: true });
      } else {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email,
          photoURL: user.photoURL || "",
          active: true,
          createdAt: new Date(),
        });
      }

      toast.success("Successfully logged in!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Email login error:", error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email address");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;
        case "auth/too-many-requests":
          toast.error("Too many failed attempts. Please try again later");
          break;
        default:
          toast.error("Failed to login. Please check your credentials");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }

    try {
      setIsResetLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox");
    } catch (error) {
      console.error("Password reset error:", error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email address");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address");
          break;
        default:
          toast.error("Failed to send reset email. Please try again");
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <CardAction>
              <Button variant="link" onClick={() => navigate("/Register")}>
                {" "}
                Sign Up
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="abc@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isResetLoading}
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline disabled:opacity-50"
                    >
                      {isResetLoading ? "Sending..." : "Forgot your password?"}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              onClick={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <Icon icon="flat-color-icons:google" width="48" height="48" />
              Login with Google
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

export default Login;
