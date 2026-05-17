import { Button } from "@/components/ui/button";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Disc3, Music, Radio, Shield, Star, Store } from "lucide-react";

interface QuickLinkBarProps {
  isAdmin: boolean;
}

export default function QuickLinkBar({ isAdmin }: QuickLinkBarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const links = [
    { path: "/", label: "Store", icon: Store },
    { path: "/showcase", label: "Showcase", icon: Star },
    { path: "/live", label: "Live", icon: Radio },
    { path: "/music-links", label: "Music", icon: Music },
    { path: "/mixtapes", label: "Mixtapes", icon: Disc3 },
  ];

  // Add admin-only link when isAdmin is true
  if (isAdmin) {
    links.push({ path: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background">
      <div className="container">
        <div className="flex items-center justify-around py-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              currentPath === link.path ||
              (link.path === "/mixtapes" &&
                currentPath.startsWith("/mixtapes"));
            return (
              <Button
                key={link.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: link.path })}
                data-ocid={`quicklink.${link.label.toLowerCase().replace(/\./g, "_")}.link`}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-2 ${
                  isActive
                    ? "text-primary-foreground bg-[#a970ff] shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" : ""}`}
                />
                <span className="text-xs font-medium">{link.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
