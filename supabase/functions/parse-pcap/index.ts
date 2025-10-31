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

function parsePCAP(buffer: Uint8Array): Packet[] {
  const packets: Packet[] = [];
  const view = new DataView(buffer.buffer);
  
  // Check PCAP magic number
  const magic = view.getUint32(0, true);
  if (magic !== 0xa1b2c3d4 && magic !== 0xd4c3b2a1) {
    throw new Error('Invalid PCAP format');
  }
  
  const littleEndian = magic === 0xa1b2c3d4;
  let offset = 24; // Skip global header
  let packetId = 1;
  
  while (offset + 16 <= buffer.length) {
    try {
      const tsSec = view.getUint32(offset, littleEndian);
      const tsUsec = view.getUint32(offset + 4, littleEndian);
      const capturedLen = view.getUint32(offset + 8, littleEndian);
      const originalLen = view.getUint32(offset + 12, littleEndian);
      
      offset += 16;
      
      if (offset + capturedLen > buffer.length) break;
      
      const packetData = buffer.slice(offset, offset + capturedLen);
      offset += capturedLen;
      
      const packet = parsePacketData(packetId++, tsSec, tsUsec, capturedLen, packetData);
      packets.push(packet);
    } catch (err) {
      console.error('Error parsing PCAP packet:', err);
      break;
    }
  }
  
  return packets;
}

function parsePCAPNG(buffer: Uint8Array): Packet[] {
  const packets: Packet[] = [];
  const view = new DataView(buffer.buffer);
  let offset = 0;
  let packetId = 1;
  
  while (offset + 12 <= buffer.length) {
    try {
      const blockType = view.getUint32(offset, true);
      const blockLength = view.getUint32(offset + 4, true);
      
      if (offset + blockLength > buffer.length) break;
      
      // Enhanced Packet Block (0x00000006)
      if (blockType === 0x00000006) {
        if (blockLength >= 32) {
          const tsHigh = view.getUint32(offset + 12, true);
          const tsLow = view.getUint32(offset + 16, true);
          const capturedLen = view.getUint32(offset + 20, true);
          const originalLen = view.getUint32(offset + 24, true);
          
          // Calculate timestamp (microseconds)
          const timestamp = (tsHigh * 4294967296 + tsLow) / 1000000;
          const tsSec = Math.floor(timestamp);
          const tsUsec = Math.floor((timestamp - tsSec) * 1000000);
          
          const packetDataOffset = offset + 28;
          const packetData = buffer.slice(packetDataOffset, packetDataOffset + capturedLen);
          
          const packet = parsePacketData(packetId++, tsSec, tsUsec, capturedLen, packetData);
          packets.push(packet);
        }
      }
      // Simple Packet Block (0x00000003)
      else if (blockType === 0x00000003) {
        if (blockLength >= 16) {
          const originalLen = view.getUint32(offset + 8, true);
          const capturedLen = Math.min(originalLen, blockLength - 16);
          
          const packetDataOffset = offset + 12;
          const packetData = buffer.slice(packetDataOffset, packetDataOffset + capturedLen);
          
          const now = Date.now();
          const packet = parsePacketData(packetId++, Math.floor(now / 1000), (now % 1000) * 1000, capturedLen, packetData);
          packets.push(packet);
        }
      }
      // Packet Block (0x00000002) - obsolete but still used
      else if (blockType === 0x00000002) {
        if (blockLength >= 32) {
          const tsHigh = view.getUint32(offset + 12, true);
          const tsLow = view.getUint32(offset + 16, true);
          const capturedLen = view.getUint32(offset + 20, true);
          const originalLen = view.getUint32(offset + 24, true);
          
          const timestamp = (tsHigh * 4294967296 + tsLow) / 1000000;
          const tsSec = Math.floor(timestamp);
          const tsUsec = Math.floor((timestamp - tsSec) * 1000000);
          
          const packetDataOffset = offset + 28;
          const packetData = buffer.slice(packetDataOffset, packetDataOffset + capturedLen);
          
          const packet = parsePacketData(packetId++, tsSec, tsUsec, capturedLen, packetData);
          packets.push(packet);
        }
      }
      
      offset += blockLength;
    } catch (err) {
      console.error('Error parsing PCAPNG block:', err);
      break;
    }
  }
  
  return packets;
}

function parsePacketData(
  packetId: number,
  tsSec: number,
  tsUsec: number,
  capturedLen: number,
  packetData: Uint8Array
): Packet {
  const timestamp = new Date(tsSec * 1000 + tsUsec / 1000).toLocaleTimeString();
  
  let srcIP = 'Unknown';
  let dstIP = 'Unknown';
  let protocolName = 'UNKNOWN';
  let isAnomaly = false;
  
  // Parse Ethernet frame
  if (capturedLen >= 34) {
    const etherType = (packetData[12] << 8) | packetData[13];
    
    if (etherType === 0x0800) { // IPv4
      const ipStart = 14;
      const protocol = packetData[ipStart + 9];
      
      srcIP = `${packetData[ipStart + 12]}.${packetData[ipStart + 13]}.${packetData[ipStart + 14]}.${packetData[ipStart + 15]}`;
      dstIP = `${packetData[ipStart + 16]}.${packetData[ipStart + 17]}.${packetData[ipStart + 18]}.${packetData[ipStart + 19]}`;
      
      if (protocol === 6) protocolName = 'TCP';
      else if (protocol === 17) protocolName = 'UDP';
      else if (protocol === 1) protocolName = 'ICMP';
      else protocolName = `IP-${protocol}`;
      
      // Check for HTTP/HTTPS
      if (protocol === 6 && capturedLen > 54) {
        const tcpStart = ipStart + 20;
        const srcPort = (packetData[tcpStart] << 8) | packetData[tcpStart + 1];
        const dstPort = (packetData[tcpStart + 2] << 8) | packetData[tcpStart + 3];
        
        if (srcPort === 80 || dstPort === 80) protocolName = 'HTTP';
        else if (srcPort === 443 || dstPort === 443) protocolName = 'HTTPS';
        else if (srcPort === 53 || dstPort === 53) protocolName = 'DNS';
      }
      
      isAnomaly = capturedLen > 1500 || capturedLen < 60;
    } else if (etherType === 0x0806) { // ARP
      protocolName = 'ARP';
      srcIP = 'Broadcast';
      dstIP = 'Broadcast';
    } else if (etherType === 0x86dd) { // IPv6
      protocolName = 'IPv6';
      srcIP = 'IPv6';
      dstIP = 'IPv6';
    }
  }
  
  return {
    id: packetId,
    timestamp,
    source: srcIP,
    destination: dstIP,
    protocol: protocolName,
    length: capturedLen,
    info: `${protocolName} packet from ${srcIP} to ${dstIP}`,
    isAnomaly,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PCAP/PCAPNG parsing...');
    
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

    const buffer = new Uint8Array(fileBuffer);
    
    // Detect file format
    const view = new DataView(buffer.buffer);
    const magic = view.getUint32(0, true);
    
    let packets: Packet[] = [];
    
    // PCAPNG format (Section Header Block magic: 0x0a0d0d0a)
    if (magic === 0x0a0d0d0a || magic === 0x1a2b3c4d) {
      console.log('Detected PCAPNG format');
      packets = parsePCAPNG(buffer);
    }
    // PCAP format
    else if (magic === 0xa1b2c3d4 || magic === 0xd4c3b2a1) {
      console.log('Detected PCAP format');
      packets = parsePCAP(buffer);
    } else {
      throw new Error(`Unsupported file format (magic: 0x${magic.toString(16)})`);
    }
    
    console.log(`Parsing complete. Total packets: ${packets.length}`);

    // Generate protocol distribution
    const protocolCounts = packets.reduce((acc, p) => {
      acc[p.protocol] = (acc[p.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartColors = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];
    const protocolData = Object.entries(protocolCounts).map(([name, count], index) => ({
      name,
      count,
      fill: `hsl(var(${chartColors[index % chartColors.length]}))`,
    }));

    // Generate timeline data
    const timelineBuckets: Record<string, number> = {};
    packets.forEach(p => {
      const timeKey = p.timestamp.split(':').slice(0, 2).join(':');
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
    console.error('Error processing file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
