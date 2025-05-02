import React from 'react';
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CircleDollarSign, 
  CreditCard, 
  BarChart, 
  Key, 
  Activity, 
  Settings 
} from 'lucide-react';

export function SidebarNav() {
  const items = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Templates",
      href: "/admin/templates",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: "Subscriptions",
      href: "/admin/subscriptions",
      icon: <CircleDollarSign className="h-4 w-4" />,
    },
    {
      title: "Payments",
      href: "/admin/payment",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart className="h-4 w-4" />,
    },
    {
      title: "API Keys",
      href: "/admin/api-keys",
      icon: <Key className="h-4 w-4" />,
    },
    {
      title: "System Status",
      href: "/admin/system-status",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const [location] = useLocation();

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
        >
          <Button
            variant={location === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              location === item.href
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline"
            )}
          >
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
} 