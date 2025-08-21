import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, Video } from "lucide-react";

const CallButton = ({ onAudioCall, onVideoCall, disabled }) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onAudioCall}
        disabled={disabled}
      >
        <Phone className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onVideoCall}
        disabled={disabled}
      >
        <Video className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CallButton;
