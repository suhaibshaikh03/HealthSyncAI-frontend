"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, FileText, Activity, Loader2, Upload, HeartPulse, Brain, TrendingUp } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
const API_URL = process.env.NODE_ENV === 'development' 
  ? "http://localhost:5000" 
  : "https://healthsyncai-backend-580700595487.europe-west1.run.app";

interface User {
  id?: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  email?: string;
}

interface Report {
  _id: string;
  filename: string;
  fileUrl: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user + reports
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/profile/getuser`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        setUser(data.user);

        const reportRes = await fetch(`${API_URL}/report/myreports`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (reportRes.ok) {
          const reportData = await reportRes.json();
          setReports(reportData.reports || []);
        }

      } catch (error) {
        console.error(error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Upload button trigger
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Upload report to Cloudinary via backend
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return Swal.fire("Error", "No file selected", "error");

    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      return Swal.fire("Error", "Only PDF, PNG, JPG allowed!", "error");
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const res = await fetch(`${API_URL}/report/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Error parsing response JSON:", parseError);
        throw new Error("Invalid response from server. Please try again later.");
      }

      if (!res.ok) {
        // Handle different status codes appropriately
        let errorMessage = data?.error || data?.message || `Upload failed with status ${res.status}`;

        // If errorMessage is an object, convert it to string
        if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
        }

        throw new Error(errorMessage);
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Report uploaded and analyzed successfully!",
        confirmButtonText: "View Analysis",
        showCancelButton: true,
        cancelButtonText: "Close"
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/dashboard/report-page/${data.report._id}`);
        }
      });

      // ✅ Add newly uploaded Cloudinary report to state
      setReports((prev) => [data.report, ...prev]);
    } catch (err: any) {
      console.error("Upload error:", err);
      Swal.fire("Error", err.message || "Error uploading file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              Welcome back, {user?.firstname ? user.firstname : "User"} 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Your personalized health insights dashboard
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button 
              onClick={handleUploadClick} 
              disabled={isUploading}
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 text-md rounded-xl flex items-center justify-center min-w-[200px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" /> 
                  Upload New Report
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/ai-insights')}
              className="border-2 border-red-200 hover:bg-red-50 px-6 py-3 rounded-xl flex items-center justify-center min-w-[200px]"
            >
              <Brain className="w-5 h-5 mr-2 text-red-600" />
              AI Insights
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Quick Stats / Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Upload Card */}
          <Card
            className="group cursor-pointer border border-red-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative hover:border-red-300"
            onClick={handleUploadClick}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:h-full transition-all duration-300" />
            <CardHeader className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Detailed Analysis</CardTitle>
              </div>
              <CardDescription className="text-base pt-2">
                Upload medical reports for AI-powered insights
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Vitals Card */}
          <Card className="group cursor-pointer border border-red-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative hover:border-rose-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 group-hover:h-full transition-all duration-300" />
            <CardHeader className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                  <HeartPulse className="w-6 h-6 text-rose-600" />
                </div>
                <CardTitle className="text-xl">Track Vitals</CardTitle>
              </div>
              <CardDescription className="text-base pt-2">
                Monitor health metrics over time
              </CardDescription>
            </CardHeader>
          </Card>

          {/* AI Insights Card */}
          <Card className="group cursor-pointer border border-red-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative hover:border-purple-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:h-full transition-all duration-300" />
            <CardHeader className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">AI Insights</CardTitle>
              </div>
              <CardDescription className="text-base pt-2">
                Get personalized health recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Trends Card */}
          <Card className="group cursor-pointer border border-red-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative hover:border-amber-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:h-full transition-all duration-300" />
            <CardHeader className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Health Trends</CardTitle>
              </div>
              <CardDescription className="text-base pt-2">
                Track your health progress over time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Reports Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-red-600" />
              Recent Reports
            </h2>
            {reports.length > 0 && (
              <span className="text-sm text-gray-500">
                {reports.length} report{reports.length !== 1 ? 's' : ''} total
              </span>
            )}
          </div>

          <Card className="border border-red-200 shadow-sm bg-white">
            <CardContent className="p-6">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-gradient-to-br from-red-100 to-rose-100 p-5 rounded-full mb-6">
                    <FileText className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Upload your first medical report to get AI-powered insights and analysis
                  </p>
                  <Button 
                    onClick={handleUploadClick} 
                    className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-6 py-3 rounded-xl"
                  >
                    <Upload className="w-5 h-5 mr-2" /> 
                    Upload Your First Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((r) => (
                    <div
                      key={r._id}
                      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-xl border border-red-100 hover:border-red-300 hover:shadow-md transition-all duration-200 bg-red-50/30 hover:bg-white"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0 w-full md:w-auto">
                        <div className="p-3 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg border border-red-200">
                          <FileText className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                            {r.filename}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            Uploaded just now
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full md:w-auto gap-3">
                        <Link href={`/dashboard/report-page/${r._id}`} className="w-full md:w-auto">
                          <Button 
                            variant="default" 
                            className="w-full md:w-auto bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white"
                          >
                            View Analysis
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="border-red-300 hover:bg-red-50 w-full md:w-auto"
                          onClick={() => navigator.clipboard.writeText(r.fileUrl)}
                        >
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
