"use client";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useLayoutEffect, useState } from "react";

const entryPanelLayout = [
  { height: 72, x: -8 },
  { height: 96, x: 7 },
  { height: 80, x: -6 },
  { height: 100, x: 8 },
  { height: 86, x: 5 },
] as const;

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 38 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-12%" }} transition={{ duration: .8, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
export function EntryCurtain() {
  return null;
}

