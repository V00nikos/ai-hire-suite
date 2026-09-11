import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useNotifications, 
  useMarkAsRead, 
  useMarkAllAsRead,
  getNotificationMessage,
  getNotificationTime 
} from "@/hooks/useNotifications";
import { Bell, CheckCheck, Loader2, Inbox } from "lucide-react";

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in bg-liquid min-h-screen -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notifications
              </h1>
              <p className="mt-1 text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                className="glass"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notifications yet</p>
                  <p className="text-sm">Activity will appear here when things happen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                        notification.is_read 
                          ? 'bg-background/30 hover:bg-background/50' 
                          : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
                      }`}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      <div className={`p-2 rounded-full ${
                        notification.is_read ? 'bg-muted' : 'bg-primary/10'
                      }`}>
                        <Bell className={`h-4 w-4 ${
                          notification.is_read ? 'text-muted-foreground' : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          notification.is_read ? 'text-muted-foreground' : 'text-foreground font-medium'
                        }`}>
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getNotificationTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
