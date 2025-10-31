import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, Shield, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import { AIInsights as AIInsightsType } from "@/services/geminiAI";

interface AIInsightsProps {
  insights: AIInsightsType;
}

export const AIInsights = ({ insights }: AIInsightsProps) => {
  return (
    <Card className="w-full border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <CardTitle className="text-2xl">AI Network Analysis</CardTitle>
            <CardDescription>Powered by Gemini 2.0 Flash</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Executive Summary */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Executive Summary
          </h3>
          <p className="text-muted-foreground">{insights.summary}</p>
        </div>

        <Separator />

        {/* Traffic Patterns */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Traffic Patterns
          </h3>
          <ul className="space-y-2">
            {insights.trafficPatterns.map((pattern, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">
                  {index + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">{pattern}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Protocol Analysis */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Protocol Analysis
          </h3>
          <ul className="space-y-2">
            {insights.protocolAnalysis.map((analysis, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">
                  {index + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">{analysis}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Anomaly Assessment */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Anomaly Assessment
          </h3>
          <ul className="space-y-2">
            {insights.anomalyAssessment.map((assessment, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">
                  {index + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">{assessment}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Security Concerns */}
        {insights.securityConcerns.length > 0 && (
          <>
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Security Concerns
              </h3>
              <ul className="space-y-2">
                {insights.securityConcerns.map((concern, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Recommendations */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 border-amber-500 text-amber-500">
                  {index + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Performance Metrics */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-500" />
            Performance Metrics
          </h3>
          <ul className="space-y-2">
            {insights.performanceMetrics.map((metric, index) => (
              <li key={index} className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">
                  {index + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">{metric}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
