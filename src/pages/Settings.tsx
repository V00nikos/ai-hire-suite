import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, Sun, Moon, Monitor, Database, RefreshCw, Loader2, History, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncTable, useSyncAllTables, SYNC_TABLES } from "@/hooks/useDatabaseSync";
import { useSyncAuditLogs, useLastSuccessfulSync } from "@/hooks/useSyncAudit";
import { useState, useCallback } from "react";
import { SyncProgressBar } from "@/components/dashboard/SyncProgressBar";
import { format } from "date-fns";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const syncTable = useSyncTable();
  const syncAllTables = useSyncAllTables();
  const { data: auditLogs = [] } = useSyncAuditLogs(5);
  const { data: lastSync } = useLastSuccessfulSync();
  
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; count: number } | null>>({});
  const [currentSyncTable, setCurrentSyncTable] = useState<string | null>(null);
  const [completedTables, setCompletedTables] = useState<string[]>([]);
  const [failedTables, setFailedTables] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncTable = async (tableName: string) => {
    setSyncResults(prev => ({ ...prev, [tableName]: null }));
    setCurrentSyncTable(tableName);
    const result = await syncTable.mutateAsync({ tableName, operation: 'upsert' });
    setSyncResults(prev => ({ 
      ...prev, 
      [tableName]: { success: result.success, count: result.successful } 
    }));
    setCurrentSyncTable(null);
  };

  const handleSyncAll = useCallback(async () => {
    setSyncResults({});
    setCompletedTables([]);
    setFailedTables([]);
    setIsSyncing(true);

    // Sync tables one by one to show progress
    for (const table of SYNC_TABLES) {
      setCurrentSyncTable(table.name);
      try {
        const result = await syncTable.mutateAsync({ tableName: table.name, operation: 'upsert' });
        if (result.success) {
          setCompletedTables(prev => [...prev, table.name]);
        } else {
          setFailedTables(prev => [...prev, table.name]);
        }
        setSyncResults(prev => ({
          ...prev,
          [table.name]: { success: result.success, count: result.successful }
        }));
      } catch {
        setFailedTables(prev => [...prev, table.name]);
      }
    }

    setCurrentSyncTable(null);
    setIsSyncing(false);
  }, [syncTable]);

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-3xl mx-auto bg-liquid min-h-screen -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Database Sync */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Database Sync
              </CardTitle>
              <CardDescription>Sync data to your personal database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Last sync info */}
              {lastSync && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/30 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span>Last successful sync: {format(new Date(lastSync.completed_at!), 'MMM d, yyyy HH:mm')}</span>
                  <span className="text-success">• {lastSync.records_synced} records</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-sm">Full Database Sync</p>
                  <p className="text-sm text-muted-foreground">Sync all tables in correct order</p>
                </div>
                <Button 
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  size="sm"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync All Tables
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress Bar */}
              <SyncProgressBar
                tables={SYNC_TABLES.map(t => ({ name: t.name, label: t.label }))}
                currentTable={currentSyncTable}
                completedTables={completedTables}
                failedTables={failedTables}
                isActive={isSyncing}
              />
              
              <Separator className="bg-border/50" />

              {/* Sync Audit History */}
              {auditLogs.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">Sync History</p>
                  </div>
                  <div className="space-y-2">
                    {auditLogs.slice(0, 3).map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
                          log.status === 'completed' ? 'bg-success/5' :
                          log.status === 'failed' ? 'bg-destructive/5' :
                          'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === 'completed' ? 'bg-success' :
                            log.status === 'failed' ? 'bg-destructive' :
                            'bg-warning animate-pulse'
                          }`} />
                          <span className="capitalize">{log.sync_type}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {format(new Date(log.started_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <span className={`font-medium ${
                          log.status === 'completed' ? 'text-success' :
                          log.status === 'failed' ? 'text-destructive' :
                          'text-warning'
                        }`}>
                          {log.records_synced} synced
                          {log.records_failed > 0 && ` / ${log.records_failed} failed`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Profile
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" defaultValue="John Doe" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@company.com" defaultValue="john@company.com" className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Acme Inc." defaultValue="Acme Inc." className="bg-background/50" />
              </div>
              <Button size="sm">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">New Applications</p>
                  <p className="text-sm text-muted-foreground">Get notified when candidates apply</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">AI Evaluation Complete</p>
                  <p className="text-sm text-muted-foreground">When AI finishes scoring candidates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Weekly Digest</p>
                  <p className="text-sm text-muted-foreground">Summary of pipeline activity</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" className="glass">Enable</Button>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <Button variant="outline" size="sm" className="glass">Update</Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-sm mb-3">Theme</p>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className={theme !== "light" ? "glass" : ""}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className={theme !== "dark" ? "glass" : ""}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                    className={theme !== "system" ? "glass" : ""}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
