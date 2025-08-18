import { motion } from "motion/react";

export const AdminSettings = () => {
  return (
    <>
      <div className="min-h-screen bg-muted/30 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            className="bg-card rounded-lg border shadow-sm p-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground">
                  Configure system settings and preferences
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
