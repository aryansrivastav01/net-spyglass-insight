import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

export interface NetworkData {
  packets: any[];
  protocolData: any[];
  timelineData: any[];
  stats: {
    totalPackets: number;
    anomalies: number;
    protocols: number;
    activeConnections: number;
  };
}

export interface AIInsights {
  summary: string;
  trafficPatterns: string[];
  protocolAnalysis: string[];
  anomalyAssessment: string[];
  securityConcerns: string[];
  recommendations: string[];
  performanceMetrics: string[];
}

export async function analyzeNetworkWithAI(networkData: NetworkData): Promise<AIInsights> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Prepare network data summary for AI analysis
    const dataContext = {
      totalPackets: networkData.stats.totalPackets,
      anomaliesCount: networkData.stats.anomalies,
      anomalyRate: ((networkData.stats.anomalies / networkData.stats.totalPackets) * 100).toFixed(2),
      protocolsUsed: networkData.stats.protocols,
      activeConnections: networkData.stats.activeConnections,
      protocolDistribution: networkData.protocolData.map(p => ({
        protocol: p.name,
        count: p.count,
        percentage: ((p.count / networkData.stats.totalPackets) * 100).toFixed(1)
      })),
      recentPackets: networkData.packets.slice(0, 20).map(p => ({
        protocol: p.protocol,
        source: p.source,
        destination: p.destination,
        isAnomaly: p.isAnomaly,
        info: p.info
      })),
      trafficTrend: networkData.timelineData.map(t => ({
        time: t.time,
        packets: t.packets
      }))
    };

    const prompt = `You are an expert network security analyst. Analyze the following network traffic data and provide comprehensive insights.

Network Traffic Data:
${JSON.stringify(dataContext, null, 2)}

Please provide a detailed analysis in the following JSON format:
{
  "summary": "A concise 2-3 sentence executive summary of the network traffic state",
  "trafficPatterns": ["pattern1", "pattern2", "pattern3"],
  "protocolAnalysis": ["analysis1", "analysis2", "analysis3"],
  "anomalyAssessment": ["assessment1", "assessment2"],
  "securityConcerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "performanceMetrics": ["metric1", "metric2"]
}

Guidelines:
- Be specific and actionable in your recommendations
- Identify actual trends from the traffic timeline data
- Assess the anomaly rate and its implications
- Analyze protocol distribution for optimization opportunities
- Identify potential security risks based on packet patterns
- Provide performance insights based on traffic volume
- Keep each point concise (1-2 sentences)

Return ONLY valid JSON, no markdown or additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from potential markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const insights: AIInsights = JSON.parse(jsonText);
    return insights;

  } catch (error) {
    console.error("Error analyzing network data with AI:", error);
    throw new Error("Failed to analyze network data. Please try again.");
  }
}
