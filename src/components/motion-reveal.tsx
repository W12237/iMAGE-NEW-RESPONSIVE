"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(max-width: 768px)");
    const sync = () => setMobile(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: mobile ? 18 : 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: mobile ? "-20px" : "-10%" }}
      transition={{
        duration: mobile ? 0.55 : 0.75,
        delay: mobile ? Math.min(delay, 0.15) : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function EntryCurtain() {
  return null;
}


