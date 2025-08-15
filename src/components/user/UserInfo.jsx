import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Building2, Briefcase } from "lucide-react";

export const UserInfo = ({ user, isOpen, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-xl font-semibold">
            User Profile
          </DialogTitle>
        </DialogHeader>

        {user ? (
          <div className="space-y-6">
            {/* Avatar and Basic Info Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="flex-shrink-0">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-gray-100">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {user.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold  break-words">
                  {user.displayName || "Anonymous User"}
                </h2>

                {user.email && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm ">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Department and Position Tags */}
            {(user.department || user.position) && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium ">Role Information</h3>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {user.department && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {user.department}
                      </span>
                    </div>
                  )}
                  {user.position && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
                      <Briefcase className="w-3.5 h-3.5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {user.position}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No user information available</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handleClose}
            className="min-w-[80px]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
