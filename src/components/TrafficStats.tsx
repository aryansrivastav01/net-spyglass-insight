import { Activity, AlertTriangle, CheckCircle, Network } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TrafficStatsProps {
  totalPackets: number;
  anomalies: number;
  protocols: number;
  activeConnections: number;
}

export const TrafficStats = ({ totalPackets, anomalies, protocols, activeConnections }: TrafficStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Packets</p>
            <p className="text-2xl font-bold text-primary">{totalPackets.toLocaleString()}</p>
          </div>
          <Network className="w-8 h-8 text-primary" />
        </div>
      </Card>

      <Card className="p-6 border-success/20 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Active Connections</p>
            <p className="text-2xl font-bold text-success">{activeConnections}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
      </Card>

      <Card className="p-6 border-warning/20 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Protocols Detected</p>
            <p className="text-2xl font-bold text-warning">{protocols}</p>
          </div>
          <Activity className="w-8 h-8 text-warning" />
        </div>
      </Card>

      <Card className="p-6 border-destructive/20 bg-card/50 backdrop-blur glow-destructive">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Anomalies</p>
            <p className="text-2xl font-bold text-destructive">{anomalies}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
      </Card>
    </div>
  );
};
