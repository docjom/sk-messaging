import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NoInternetConnectionAlert() {
  return (
    <div className="grid w-full max-w-xl items-start gap-4">
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>No internet connection.</AlertTitle>
        <AlertDescription>
          <p>Please check your wifi or data connection.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
