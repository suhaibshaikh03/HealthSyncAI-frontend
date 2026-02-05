"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, FileText, Activity } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
const API_URL = "https://b22slwwqfmushdcf7t4cnkxt240xknbz.lambda-url.eu-north-1.on.aws";

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
        console.log(reportRes);

        if (reportRes.ok) {
          const reportData = await reportRes.json();
          console.log(reportData.reports[0], "ii");

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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/report/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Upload failed");

      Swal.fire("Success", "Report uploaded successfully!", "success");

      // ✅ Add newly uploaded Cloudinary report to state
      setReports((prev) => [data.report, ...prev]);
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Error uploading file", "error");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back, {user?.firstname ? user.firstname : "User"}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Here's an overview of your health insights today.
            </p>
          </div>
          <Button onClick={handleUploadClick} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-black text-white px-6 py-6 text-md rounded-full">
            <Plus className="w-5 h-5 mr-2" /> Upload New Report
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Quick Stats / Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Upload Card */}
          <Card
            className="group cursor-pointer border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative"
            onClick={handleUploadClick}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:h-full transition-all duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                Detailed Analysis
              </CardTitle>
              <CardDescription className="text-base pt-2">
                Upload your medical reports (PDF/Image) to get instant AI-powered summaries and insights in English & Urdu.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Vitals Card (Placeholder) */}
          <Card className="group cursor-pointer border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:h-full transition-all duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                Track Vitals
              </CardTitle>
              <CardDescription className="text-base pt-2">
                Monitor your vital signs like Blood Pressure, Sugar levels, and BMI over time. (Coming Soon)
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Reports Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Reports</h2>
          </div>

          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No reports found</h3>
                  <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                    Start via uploading your first medical report to see the magic happen.
                  </p>
                  <Button variant="outline" onClick={handleUploadClick} className="mt-6">
                    Upload First Report
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {reports.map((r) => (
                    <div
                      key={r._id}
                      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 bg-gray-50/50 hover:bg-white"
                    >
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {r.filename}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Uploaded recently
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full md:w-auto gap-3">
                        <Link href={`/dashboard/report-page/${r._id}`} className="w-full md:w-auto">
                          <Button variant="secondary" className="w-full md:w-auto bg-white hover:bg-gray-50 border border-gray-200">
                            View Analysis
                          </Button>
                        </Link>
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
