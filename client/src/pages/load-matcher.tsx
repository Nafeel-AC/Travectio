import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import IntelligentLoadMatcher from "@/components/intelligent-load-matcher";

export default function LoadMatcher() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Load Matcher</h1>
        <p className="text-slate-400">
          Advanced load recommendation engine with multi-factor scoring and market analysis
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Intelligent Load Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <IntelligentLoadMatcher />
        </CardContent>
      </Card>
    </div>
  );
}