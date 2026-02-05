"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, FileText, Languages, BrainCircuit } from "lucide-react";

const API_URL = "https://healthsyncai-backend-580700595487.europe-west1.run.app";

interface Insight {
  _id: string;
  reportTitle: string;
  summary: string;
  explanation_en: string;
  explanation_ro: string;
}

export default function Insights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/report/insights`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setInsights(data.insights || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-blue-500 animate-pulse" />
          <p className="text-muted-foreground">Gathering health insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center justify-center md:justify-start gap-3">
            <Sparkles className="w-8 h-8 text-blue-600" />
            AI Health Insights
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Compare and understand your medical reports with simplified AI explanations.
          </p>
        </div>

        {insights.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-blue-50 p-4 rounded-full inline-flex mb-4">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">No insights yet</h3>
            <p className="text-gray-500 mt-2">Upload a report from the dashboard to see analysis here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {insights.map((ins) => (
              <Card key={ins._id} className="border-none shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                <CardHeader className="border-b border-gray-50 bg-white pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                    <FileText className="w-6 h-6 text-blue-600" />
                    {ins.reportTitle}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

                  {/* Box 1: Summary */}
                  <div className="lg:col-span-3">
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" /> Executive Summary
                      </h3>
                      <p className="text-gray-800 leading-relaxed text-lg">
                        {ins.summary || "No summary available."}
                      </p>
                    </div>
                  </div>

                  {/* Box 2: Detailed Explanation (EN) */}
                  <div className="lg:col-span-2">
                    <div className="h-full bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                      <h3 className="relative z-10 text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" /> Detailed Explanation
                      </h3>
                      <p className="relative z-10 text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {ins.explanation_en || "No explanation available."}
                      </p>
                    </div>
                  </div>

                  {/* Box 3: Roman Urdu */}
                  <div className="lg:col-span-1">
                    <div className="h-full bg-emerald-50/50 rounded-xl p-6 border border-emerald-100 relative">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 mb-4 flex items-center gap-2">
                        <Languages className="w-4 h-4" /> Roman Urdu
                      </h3>
                      <p className="text-emerald-900/80 leading-relaxed italic text-sm">
                        {ins.explanation_ro ? `"${ins.explanation_ro}"` : "Translation not available."}
                      </p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
