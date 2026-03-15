"use client";

import { motion } from "framer-motion";

export default function AnimatedButton({
  children,
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -2, scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}