import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, Heart, BookOpen, User, Menu, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import GlobalSearch from "./GlobalSearch";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  hideMobileHeader?: boolean;
  disablePadding?: boolean;
}

const Layout = ({ children, hideMobileHeader = false, disablePadding = false }: LayoutProps) => {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const currentPath = location.pathname;

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/chat", icon: MessageCircle, label: "Chat" },
    { path: "/journal", icon: BookOpen, label: "Journal" },
    { path: "/wellness", icon: Heart, label: "Activities" },
    // { path: "/resources", icon: BookOpen, label: "Resources" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl animate-float" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-secondary/5 dark:bg-secondary/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-accent/5 dark:bg-accent/10 blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-border bg-background/80 dark:bg-card/50 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Serenify Logo" className="w-14 h-14 rounded-full shadow-sm" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Serenify
          </span>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 dark:bg-muted/30 rounded-full p-1.5 relative">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 z-10",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary rounded-full shadow-md shadow-primary/20 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline text-xs opacity-50">Cmd+K</span>
          </Button>

          <Link to="/crisis">
            <Button
              variant="destructive"
              size="sm"
              className="shadow-lg hover:shadow-xl transition-all"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Crisis Help
            </Button>
          </Link>
        </div>
      </nav>

      {/* Mobile Header */}
      {!hideMobileHeader && (
        <nav className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 dark:border-border bg-background/80 dark:bg-card/50 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Serenify Logo" className="w-12 h-12 rounded-full shadow-sm" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Serenify
            </span>
          </div>

          <Link to="/crisis">
            <Button variant="destructive" size="sm" className="gap-1.5 shadow-md">
              <AlertCircle className="h-4 w-4" />
              Crisis
            </Button>
          </Link>
        </nav>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 relative z-10",
        disablePadding ? "pb-0 md:pb-8" : "pb-24 md:pb-8"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 dark:border-border bg-background/95 dark:bg-card/95 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]",
                  currentPath === item.path
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", currentPath === item.path && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div >
  );
};

export default Layout;
