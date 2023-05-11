import { motion } from "framer-motion";

const DURATION = 0.5;
const DOTS = 3;

export default function Loader() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: DOTS }).map((_, index) => {
        return (
          <motion.div
            key={index}
            className="h-1 w-1 rounded-full bg-red-500"
            animate={{
              // TODO: reference tailwind variables instead
              backgroundColor: ["#dcdcdc", "#272422", "#dcdcdc"],
            }}
            transition={{
              times: [0, 0.5, 1],
              duration: DURATION,
              repeat: Number.POSITIVE_INFINITY,
              delay: DURATION * index,
              repeatDelay: DURATION * (DOTS - 1),
            }}
          />
        );
      })}
    </div>
  );
}
