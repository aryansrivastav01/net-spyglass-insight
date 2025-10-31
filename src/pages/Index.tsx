import { useState, useMemo, useRef } from "react";
import { Upload, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrafficStats } from "@/components/TrafficStats";
import { PacketTable } from "@/components/PacketTable";
import { ProtocolChart } from "@/components/ProtocolChart";
import { TrafficTimeline } from "@/components/TrafficTimeline";
import { FilterBar } from "@/components/FilterBar";
import { generateMockPackets, generateProtocolData, generateTimelineData } from "@/utils/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [packets, setPackets] = useState(() => generateMockPackets(50));
  const [protocolData, setProtocolData] = useState(generateProtocolData());
  const [timelineData, setTimelineData] = useState(generateTimelineData());
  const [stats, setStats] = useState({
    totalPackets: 50,
    anomalies: 5,
    protocols: 5,
    activeConnections: 35,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pcap') && !file.name.endsWith('.pcapng')) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid PCAP file (.pcap or .pcapng)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-pcap', {
        body: formData,
      });

      if (error) throw error;

      setPackets(data.packets);
      setProtocolData(data.protocolData);
      setTimelineData(data.timelineData);
      setStats(data.stats);
      setFileName(file.name);

      toast({
        title: "PCAP Loaded Successfully",
        description: `Parsed ${data.stats.totalPackets} packets from ${file.name}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse the PCAP file';
      console.error('Error parsing PCAP:', error);
      toast({
        title: "Error Parsing PCAP",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
            {fileName && (
              <p className="text-sm text-success mt-1">
                Loaded: {fileName}
              </p>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pcap,.pcapng"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={handleFileUpload}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PCAP
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <TrafficStats
          totalPackets={stats.totalPackets}
          anomalies={stats.anomalies}
          protocols={stats.protocols}
          activeConnections={stats.activeConnections}
        />

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
