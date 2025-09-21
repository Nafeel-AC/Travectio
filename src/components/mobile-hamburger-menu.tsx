import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function MobileHamburgerMenu({ 
  isOpen, 
  onToggle, 
  className 
}: MobileHamburgerMenuProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        "relative z-50 lg:hidden",
        "text-slate-300 hover:text-white hover:bg-slate-700",
        "transition-colors duration-200",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="relative w-6 h-6">
        <Menu
          className={cn(
            "absolute inset-0 w-6 h-6 transition-all duration-300",
            isOpen && "opacity-0 rotate-90"
          )}
        />
        <X
          className={cn(
            "absolute inset-0 w-6 h-6 transition-all duration-300",
            !isOpen && "opacity-0 -rotate-90"
          )}
        />
      </div>
    </Button>
  );
}
