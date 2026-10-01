import { motion } from "framer-motion";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenu={() => setOpen(true)} />
        <main id="main" className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
