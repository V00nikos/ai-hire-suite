import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  HelpCircle,
  Plus,
  Bell,
  Menu,
  Star,
  CheckCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkAllAsRead,
  getNotificationMessage,
  getNotificationTime 
} from "@/hooks/useNotifications";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Candidates", href: "/candidates", icon: Users },
  { name: "Shortlisted", href: "/shortlisted", icon: Star },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  const isActive = (href: string) => {
    return location.pathname === href || 
      (href !== "/dashboard" && location.pathname.startsWith(href));
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="fixed left-0 top-0 z-40 hidden md:flex h-full w-16 flex-col bg-card/80 backdrop-blur-sm border-r border-border/50">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center px-2">
            <Link to="/" aria-label="AI Hire Suite home" className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft"><span className="font-vortex text-base tracking-wide pt-0.5">AI</span></Link>
          </div>

          {/* New Job Button */}
          <div className="px-3 pb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full rounded-xl justify-center shadow-soft h-10 px-0"
                  size="sm"
                  asChild
                >
                  <Link to="/jobs/new">
                    <Plus className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                New Job
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Separator */}
          <div className="mx-3 border-t border-border/50" />

          {/* Main Navigation */}
          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center justify-center rounded-xl p-2.5 transition-smooth",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </nav>

          {/* Secondary Navigation */}
          <div className="px-3 pb-2">
            <div className="mb-3 border-t border-border/50" />
            <div className="space-y-1">
              {secondaryNavigation.map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className="flex items-center justify-center rounded-xl p-2.5 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="flex items-center gap-2">
                <span className="font-vortex text-2xl tracking-tight">AI Hire Suite</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="p-4 space-y-2">
              <Button
                className="w-full justify-start mb-4"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to="/jobs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Link>
              </Button>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <div className="my-4 border-t border-border" />
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            "md:ml-16"
          )}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between md:justify-end gap-2 bg-transparent px-4 md:px-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full h-10 w-10 bg-card/80 backdrop-blur-sm border border-border/50"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification Bell - Dynamic */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-10 w-10 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-2 glass-card">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-display font-bold text-foreground">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending}
                      >
                        <CheckCheck className="mr-1 h-3 w-3" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {recentNotifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    recentNotifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id} 
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg",
                          !notification.is_read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-2 w-full">
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-sm",
                              notification.is_read ? "text-muted-foreground" : "text-foreground font-medium"
                            )}>
                              {getNotificationMessage(notification)}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {getNotificationTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="justify-center text-sm font-medium text-primary cursor-pointer"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-sm border-t border-border/50 px-2 py-2">
          <div className="flex items-center justify-around">
            {navigation.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
