import { motion } from "framer-motion";

export function MaintenanceMode() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-md w-full text-center">
        {/* Animated SVG Illustration */}
        <div className="relative mb-8">
          <svg
            width="240"
            height="180"
            viewBox="0 0 240 180"
            className="mx-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Circle */}
            <motion.circle
              cx="120"
              cy="90"
              r="80"
              fill="var(--color-secondary)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />

            {/* Main Gear */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <circle
                cx="120"
                cy="90"
                r="35"
                fill="var(--color-primary)"
                stroke="var(--color-background)"
                strokeWidth="3"
              />
              {/* Gear teeth */}
              {[...Array(8)].map((_, i) => (
                <rect
                  key={i}
                  x="118"
                  y="50"
                  width="4"
                  height="10"
                  fill="var(--color-primary)"
                  transform={`rotate(${i * 45} 120 90)`}
                />
              ))}
              <circle cx="120" cy="90" r="12" fill="var(--color-background)" />
            </motion.g>

            {/* Small Gear */}
            <motion.g
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <circle
                cx="80"
                cy="60"
                r="20"
                fill="var(--color-accent-foreground)"
                stroke="var(--color-background)"
                strokeWidth="2"
              />
              {/* Small gear teeth */}
              {[...Array(6)].map((_, i) => (
                <rect
                  key={i}
                  x="79"
                  y="38"
                  width="2"
                  height="6"
                  fill="var(--color-accent-foreground)"
                  transform={`rotate(${i * 60} 80 60)`}
                />
              ))}
              <circle cx="80" cy="60" r="6" fill="var(--color-background)" />
            </motion.g>

            {/* Wrench */}
            <motion.g
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <rect
                x="165"
                y="45"
                width="4"
                height="30"
                fill="var(--color-muted-foreground)"
                rx="2"
              />
              <circle
                cx="167"
                cy="42"
                r="5"
                fill="var(--color-muted-foreground)"
              />
              <circle cx="167" cy="42" r="3" fill="var(--color-background)" />
            </motion.g>

            {/* Screwdriver */}
            <motion.g
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <rect
                x="185"
                y="55"
                width="3"
                height="25"
                fill="var(--color-chart-1)"
                rx="1"
              />
              <rect
                x="184"
                y="75"
                width="5"
                height="8"
                fill="var(--color-muted-foreground)"
                rx="1"
              />
            </motion.g>

            {/* Floating particles */}
            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={i}
                cx={50 + i * 30}
                cy={140 + Math.sin(i) * 10}
                r="2"
                fill="var(--color-chart-2)"
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: [-5, 5, -5],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h1 className="text-foreground mb-4">We're Under Maintenance</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We're working hard to improve your experience. Our site will be back
            online shortly. Thank you for your patience!
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 text-chart-1">
            <motion.div
              className="w-2 h-2 bg-chart-1 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm">System maintenance in progress</span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          Expected downtime: 2-4 hours
        </motion.div>
      </div>
    </div>
  );
}
