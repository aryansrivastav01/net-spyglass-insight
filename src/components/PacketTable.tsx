import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Packet {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  isAnomaly?: boolean;
}

interface PacketTableProps {
  packets: Packet[];
}

const getProtocolColor = (protocol: string) => {
  switch (protocol.toUpperCase()) {
    case 'TCP':
      return 'bg-chart-1/20 text-chart-1 border-chart-1/30';
    case 'UDP':
      return 'bg-chart-2/20 text-chart-2 border-chart-2/30';
    case 'HTTP':
      return 'bg-chart-3/20 text-chart-3 border-chart-3/30';
    case 'HTTPS':
      return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
    case 'DNS':
      return 'bg-chart-5/20 text-chart-5 border-chart-5/30';
    default:
      return 'bg-muted/20 text-muted-foreground border-muted/30';
  }
};

export const PacketTable = ({ packets }: PacketTableProps) => {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-primary font-semibold">No.</TableHead>
              <TableHead className="text-primary font-semibold">Time</TableHead>
              <TableHead className="text-primary font-semibold">Source</TableHead>
              <TableHead className="text-primary font-semibold">Destination</TableHead>
              <TableHead className="text-primary font-semibold">Protocol</TableHead>
              <TableHead className="text-primary font-semibold">Length</TableHead>
              <TableHead className="text-primary font-semibold">Info</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packets.map((packet) => (
              <TableRow
                key={packet.id}
                className={`border-border/30 transition-colors ${
                  packet.isAnomaly
                    ? 'bg-destructive/10 hover:bg-destructive/20 border-l-4 border-l-destructive'
                    : 'hover:bg-secondary/50'
                }`}
              >
                <TableCell className="font-mono text-sm">{packet.id}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{packet.timestamp}</TableCell>
                <TableCell className="font-mono text-sm">{packet.source}</TableCell>
                <TableCell className="font-mono text-sm">{packet.destination}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getProtocolColor(packet.protocol)}>
                    {packet.protocol}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{packet.length} bytes</TableCell>
                <TableCell className="text-sm max-w-md truncate">{packet.info}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
