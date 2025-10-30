import { useState, useMemo } from "react";
import { Upload, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrafficStats } from "@/components/TrafficStats";
import { PacketTable } from "@/components/PacketTable";
import { ProtocolChart } from "@/components/ProtocolChart";
import { TrafficTimeline } from "@/components/TrafficTimeline";
import { FilterBar } from "@/components/FilterBar";
import { generateMockPackets, generateProtocolData, generateTimelineData } from "@/utils/mockData";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [packets] = useState(() => generateMockPackets(50));
  const [searchTerm, setSearchTerm] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("all");

  const protocolData = generateProtocolData();
  const timelineData = generateTimelineData();

  const filteredPackets = useMemo(() => {
    return packets.filter((packet) => {
      const matchesSearch =
        packet.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packet.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packet.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        packet.info.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProtocol =
        protocolFilter === "all" || packet.protocol === protocolFilter;

      return matchesSearch && matchesProtocol;
    });
  }, [packets, searchTerm, protocolFilter]);

  const stats = useMemo(() => {
    const anomalies = packets.filter((p) => p.isAnomaly).length;
    const protocols = new Set(packets.map((p) => p.protocol)).size;
    const activeConnections = Math.floor(Math.random() * 50) + 20;

    return {
      totalPackets: packets.length,
      anomalies,
      protocols,
      activeConnections,
    };
  }, [packets]);

  const handleFileUpload = () => {
    toast({
      title: "Feature Coming Soon",
      description: "PCAP file upload will be available in the next version",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
              <Activity className="w-10 h-10" />
              NetCapture Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Network Traffic Analysis & Packet Inspection
            </p>
          </div>
          <Button
            onClick={handleFileUpload}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload PCAP
          </Button>
        </div>

        {/* Stats */}
        <TrafficStats {...stats} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProtocolChart data={protocolData} />
          <TrafficTimeline data={timelineData} />
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          protocolFilter={protocolFilter}
          onProtocolChange={setProtocolFilter}
        />

        {/* Packet Table */}
        <div>
          <h2 className="text-xl font-semibold text-primary mb-4">
            Captured Packets ({filteredPackets.length})
          </h2>
          <PacketTable packets={filteredPackets} />
        </div>
      </div>
    </div>
  );
};

export default Index;
