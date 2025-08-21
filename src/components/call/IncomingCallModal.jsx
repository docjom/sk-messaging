import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Video } from "lucide-react";

const IncomingCall = ({ caller, callType, onAccept, onReject }) => {
  return (
    <Card className="fixed top-4 right-4 z-50 w-80">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            {callType === "video" ? (
              <Video className="h-8 w-8 text-blue-500" />
            ) : (
              <Phone className="h-8 w-8 text-green-500" />
            )}
          </div>
          <h3 className="font-semibold">Incoming {callType} call</h3>
          <p className="text-sm text-muted-foreground mb-4">
            from {caller.name || caller.email}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button onClick={onReject} variant="destructive">
              <PhoneOff className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomingCall;
