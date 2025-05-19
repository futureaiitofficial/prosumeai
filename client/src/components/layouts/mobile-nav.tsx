import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, File, FileEdit, FileText, Clipboard, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/resumes", label: "Resumes", icon: File },
    { href: "/cover-letters", label: "Letters", icon: FileText },
    { href: "/job-applications", label: "Jobs", icon: Clipboard },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white p-2 md:hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-5 gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link href={link.href} key={link.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-md py-2 cursor-pointer",
                  location === link.href
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-xs">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
