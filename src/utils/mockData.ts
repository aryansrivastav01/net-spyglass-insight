export const generateMockPackets = (count: number = 50) => {
  const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS'];
  const ips = [
    '192.168.1.100',
    '10.0.0.5',
    '172.16.0.20',
    '8.8.8.8',
    '1.1.1.1',
    '142.250.185.46',
    '157.240.22.35',
  ];
  const infos = [
    'SYN packet, establishing connection',
    'ACK packet, connection acknowledged',
    'Standard query A example.com',
    'HTTP GET /api/data',
    'TLS handshake initiated',
    'Data transfer in progress',
    'Connection termination FIN',
    'DNS response with multiple A records',
  ];

  const packets = [];
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const isAnomaly = Math.random() < 0.15; // 15% chance of anomaly

    packets.push({
      id: i,
      timestamp: new Date(now - (count - i) * 1000).toLocaleTimeString(),
      source: ips[Math.floor(Math.random() * ips.length)],
      destination: ips[Math.floor(Math.random() * ips.length)],
      protocol,
      length: Math.floor(Math.random() * 1500) + 64,
      info: infos[Math.floor(Math.random() * infos.length)],
      isAnomaly,
    });
  }

  return packets;
};

export const generateProtocolData = () => {
  return [
    { name: 'TCP', count: 2847, fill: 'hsl(var(--chart-1))' },
    { name: 'UDP', count: 1523, fill: 'hsl(var(--chart-2))' },
    { name: 'HTTP', count: 892, fill: 'hsl(var(--chart-3))' },
    { name: 'HTTPS', count: 1456, fill: 'hsl(var(--chart-4))' },
    { name: 'DNS', count: 634, fill: 'hsl(var(--chart-5))' },
  ];
};

export const generateTimelineData = () => {
  const data = [];
  const now = Date.now();

  for (let i = 20; i >= 0; i--) {
    const time = new Date(now - i * 60000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      packets: Math.floor(Math.random() * 500) + 200,
    });
  }

  return data;
};
