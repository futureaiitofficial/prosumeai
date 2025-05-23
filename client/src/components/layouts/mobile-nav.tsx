import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, File, FileText, Clipboard, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useSidebar } from "@/hooks/use-sidebar";

export default function MobileNav() {
  const [location] = useLocation();
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  const links = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/resumes", label: "Resumes", icon: File },
    { href: "/cover-letters", label: "Letters", icon: FileText },
    { href: "/job-applications", label: "Jobs", icon: Clipboard },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const handleNavClick = () => {
    closeMobileSidebar();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/80 backdrop-blur-md p-2 md:hidden dark:border-slate-800 dark:bg-slate-900/80 shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link href={link.href} key={link.href} onClick={handleNavClick}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-md py-2 px-1 cursor-pointer relative",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {isActive && (
                    <motion.div 
                      className="absolute -bottom-1.5 left-1/2 h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400"
                      layoutId="mobile-nav-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ translateX: "-50%" }}
                    />
                  )}
                </div>
                <span className={cn(
                  "mt-1 text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
