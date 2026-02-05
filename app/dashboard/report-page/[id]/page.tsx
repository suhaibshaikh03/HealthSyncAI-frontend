"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft, Trash2, HelpCircle } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

const API_URL = "http://localhost:5000";

interface Report {
  _id: string;
  filename: string;
  fileUrl: string;
  title: string;
  dateSeen?: string;
  summary: string;
  explanation_en: string;
  explanation_ro: string;
  suggested_questions: string[];
  createdAt: string;
}

const ReportPage = () => {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/report/${params.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${res.status}: Failed to fetch report`);
        }

        const data = await res.json();
        setReport(data.report);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading report");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this report!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/report/${params.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to delete report");

      Swal.fire("Deleted!", "Your report has been deleted.", "success");
      router.push("/dashboard");
    } catch (err: any) {
      Swal.fire("Error", err.message || "Error deleting report", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">{error || "Report not found"}</p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-blue-600 transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          {/* Header Card */}
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <div className="h-2 w-full bg-blue-600"></div>
            <CardHeader className="pt-8 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    {report.title || report.filename}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Uploaded on {new Date(report.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <a href={report.fileUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="border-gray-200">
                      <Download className="w-4 h-4 mr-2" /> Original File
                    </Button>
                  </a>
                  <Button variant="destructive" onClick={handleDelete} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* AI Summary Section */}
          <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {/* Executive Summary */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  Executive Summary
                </h3>
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 text-lg leading-relaxed text-gray-700">
                    {report.summary || "No summary available."}
                  </CardContent>
                </Card>
              </section>

              {/* Detailed Explanation */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                  Detailed Explanation
                </h3>
                <Card className="border-none shadow-sm bg-white">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wider text-muted-foreground">English</h4>
                      <p className="text-gray-700 leading-relaxed">
                        {report.explanation_en || "No explanation available."}
                      </p>
                    </div>
                    {report.explanation_ro && (
                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wider text-muted-foreground">Roman Urdu</h4>
                        <p className="text-gray-700 leading-relaxed font-medium italic">
                          "{report.explanation_ro}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Sidebar: Suggested Questions */}
            <div className="space-y-6">
              <Card className="border-none shadow-md bg-white sticky top-8">
                <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
                  <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Doctor Questions
                  </CardTitle>
                  <CardDescription className="text-blue-700/80">
                    Ask these at your next visit
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {report.suggested_questions && report.suggested_questions.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {report.suggested_questions.map((q, i) => (
                        <li key={i} className="p-4 hover:bg-gray-50 transition-colors text-sm text-gray-700 leading-snug">
                          {q}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      No specific questions generated.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
