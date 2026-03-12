
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}) => {
  return (
    <Card className={cn("border border-border/60 shadow-sm rounded-2xl overflow-hidden bg-background hover:shadow-md transition-all duration-300 group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-tight">{title}</CardTitle>
        <div className="p-2 bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 rounded-xl group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-3xl font-black tracking-tighter text-foreground">{value}</div>
        {description && <p className="text-sm text-muted-foreground mt-2 font-medium">{description}</p>}
        {trend && (
          <div className="flex items-center text-sm mt-3 font-medium">
            <span 
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md", 
                trend.isPositive ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/40" : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/40"
              )}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="ml-2 text-muted-foreground text-xs">desde el mes pasado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
