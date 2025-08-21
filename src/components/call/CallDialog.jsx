import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import CallInterface from "./CallInterface";

const CallDialog = ({
  open,
  onOpenChange,
  localStream,
  remoteStream,
  onEndCall,
  callType,
  isConnected,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-full h-96 bg-transparent border-0 shadow-none">
        <CallInterface
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={onEndCall}
          callType={callType}
          isConnected={isConnected}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CallDialog;
