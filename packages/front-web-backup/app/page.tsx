"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/menu");
    }, 3000); // 3 秒後にメニューへ遷移
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-black text-white"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.h1
        className="text-3xl sm:text-5xl font-bold tracking-tight"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        次世代アプリを開発しましょう
      </motion.h1>
    </motion.div>
  );
}
