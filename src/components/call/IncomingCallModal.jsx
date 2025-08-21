import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Video } from "lucide-react";

const IncomingCall = ({ caller, callType, onAccept, onReject }) => {
  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white shadow-lg rounded-lg">
      <CardContent className="p-6">
        <div className="text-center">
          {/* Caller Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-white">
              {caller.name ? caller.name[0].toUpperCase() : "?"}
            </div>
          </div>

          {/* Call Type Icon */}
          <div className="flex justify-center mb-2">
            {callType === "video" ? (
              <Video className="h-8 w-8 text-blue-500" />
            ) : (
              <Phone className="h-8 w-8 text-green-500" />
            )}
          </div>

          {/* Call Details */}
          <h3 className="font-semibold text-lg mb-1">
            Incoming {callType} Call
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            from {caller.name || caller.email || "Unknown Caller"}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
            >
              <Phone className="h-5 w-5" />
              Accept
            </Button>
            <Button
              onClick={onReject}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
            >
              <PhoneOff className="h-5 w-5" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomingCall;
