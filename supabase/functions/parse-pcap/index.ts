import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PCAP parsing...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Upload to storage
    const fileName = `${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { error: uploadError } = await supabaseClient.storage
      .from('pcap-files')
      .upload(fileName, fileBuffer, {
        contentType: 'application/vnd.tcpdump.pcap',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully, starting parse...');

    // Parse PCAP file manually
    const packets: Packet[] = [];
    const buffer = new Uint8Array(fileBuffer);
    
    // Check PCAP magic number
    const magic = new DataView(buffer.buffer).getUint32(0, true);
    if (magic !== 0xa1b2c3d4 && magic !== 0xd4c3b2a1) {
      throw new Error('Invalid PCAP file format');
    }
    
    const littleEndian = magic === 0xa1b2c3d4;
    
    // Skip global header (24 bytes)
    let offset = 24;
    let packetId = 1;
    
    while (offset + 16 <= buffer.length) {
      try {
        const view = new DataView(buffer.buffer, offset);
        
        // Read packet header
        const tsSec = view.getUint32(0, littleEndian);
        const tsUsec = view.getUint32(4, littleEndian);
        const capturedLen = view.getUint32(8, littleEndian);
        const originalLen = view.getUint32(12, littleEndian);
        
        offset += 16;
        
        if (offset + capturedLen > buffer.length) break;
        
        const packetData = buffer.slice(offset, offset + capturedLen);
        offset += capturedLen;
        
        // Parse basic packet info
        const timestamp = new Date(tsSec * 1000 + tsUsec / 1000).toLocaleTimeString();
        
        let srcIP = '0.0.0.0';
        let dstIP = '0.0.0.0';
        let protocolName = 'UNKNOWN';
        let isAnomaly = false;
        
        // Simplified parsing - check for IPv4 (ethertype 0x0800 at offset 12-13)
        if (capturedLen >= 34) {
          const etherType = (packetData[12] << 8) | packetData[13];
          
          if (etherType === 0x0800) { // IPv4
            // IP header starts at offset 14 (after Ethernet header)
            const ipStart = 14;
            const protocol = packetData[ipStart + 9];
            
            // Extract IPs
            srcIP = `${packetData[ipStart + 12]}.${packetData[ipStart + 13]}.${packetData[ipStart + 14]}.${packetData[ipStart + 15]}`;
            dstIP = `${packetData[ipStart + 16]}.${packetData[ipStart + 17]}.${packetData[ipStart + 18]}.${packetData[ipStart + 19]}`;
            
            // Determine protocol
            if (protocol === 6) protocolName = 'TCP';
            else if (protocol === 17) protocolName = 'UDP';
            else if (protocol === 1) protocolName = 'ICMP';
            
            // Simple anomaly detection
            isAnomaly = capturedLen > 1500 || capturedLen < 60;
          } else if (etherType === 0x0806) { // ARP
            protocolName = 'ARP';
            srcIP = 'ARP';
            dstIP = 'ARP';
          }
        }
        
        packets.push({
          id: packetId++,
          timestamp,
          source: srcIP,
          destination: dstIP,
          protocol: protocolName,
          length: capturedLen,
          info: `${protocolName} packet from ${srcIP} to ${dstIP}`,
          isAnomaly,
        });
      } catch (err) {
        console.error('Error parsing packet at offset', offset, ':', err);
        break;
      }
    }
    
    console.log(`Parsing complete. Total packets: ${packets.length}`);

    // Generate protocol distribution
    const protocolCounts = packets.reduce((acc, p) => {
      acc[p.protocol] = (acc[p.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const protocolData = Object.entries(protocolCounts).map(([name, count], index) => ({
      name,
      count,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));

    // Generate timeline data (group by time buckets)
    const timelineBuckets: Record<string, number> = {};
    packets.forEach(p => {
      const timeKey = p.timestamp.split(':').slice(0, 2).join(':'); // Group by minute
      timelineBuckets[timeKey] = (timelineBuckets[timeKey] || 0) + 1;
    });

    const timelineData = Object.entries(timelineBuckets)
      .sort()
      .map(([time, packets]) => ({ time, packets }));

    const response = {
      packets,
      protocolData,
      timelineData,
      stats: {
        totalPackets: packets.length,
        anomalies: packets.filter(p => p.isAnomaly).length,
        protocols: Object.keys(protocolCounts).length,
        activeConnections: new Set(packets.map(p => `${p.source}-${p.destination}`)).size,
      },
      fileName,
    };

    console.log('Sending response with stats:', response.stats);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error processing PCAP:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
