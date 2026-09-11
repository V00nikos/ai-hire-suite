import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SyncProgressBarProps {
  tables: { name: string; label: string }[];
  currentTable: string | null;
  completedTables: string[];
  failedTables: string[];
  isActive: boolean;
}

export function SyncProgressBar({ 
  tables, 
  currentTable, 
  completedTables, 
  failedTables,
  isActive 
}: SyncProgressBarProps) {
  const totalTables = tables.length;
  const completedCount = completedTables.length + failedTables.length;
  const progressPercentage = totalTables > 0 ? (completedCount / totalTables) * 100 : 0;

  if (!isActive && completedCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {isActive && (
          <motion.div
            className="absolute top-0 h-2 w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
            animate={{ x: [0, 300] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{ left: 0 }}
          />
        )}
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isActive ? `Syncing: ${currentTable || 'Starting...'}` : 'Sync complete'}
        </span>
        <span className="font-medium">
          {completedCount} / {totalTables} tables ({Math.round(progressPercentage)}%)
        </span>
      </div>

      {/* Table status grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {tables.map((table) => {
          const isCompleted = completedTables.includes(table.name);
          const isFailed = failedTables.includes(table.name);
          const isCurrent = currentTable === table.name;

          return (
            <div
              key={table.name}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all ${
                isCompleted ? 'bg-success/10 text-success' :
                isFailed ? 'bg-destructive/10 text-destructive' :
                isCurrent ? 'bg-primary/10 text-primary animate-pulse' :
                'bg-muted/50 text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
              ) : isFailed ? (
                <XCircle className="h-3 w-3 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-current flex-shrink-0" />
              )}
              <span className="truncate">{table.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
