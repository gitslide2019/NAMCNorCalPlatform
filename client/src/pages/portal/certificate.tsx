import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { NAMC_GOLD } from "@/lib/brand";

interface CourseCertData {
  id: string;
  title: string;
  description: string;
  enrollment: { progress: number; completedAt?: string } | null;
}

export default function CourseCertificate() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: course, isLoading } = useQuery<CourseCertData>({
    queryKey: ["/api/portal/courses", id],
  });

  // Auto-trigger print dialog once the certificate is ready
  useEffect(() => {
    if (course && course.enrollment && course.enrollment.progress >= 100) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [course?.id, course?.enrollment?.progress]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  if (!course || !course.enrollment || course.enrollment.progress < 100) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Certificate not available.</p>
          <p className="text-sm text-muted-foreground">You must complete the course to receive a certificate.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.close()}>Close</Button>
        </div>
      </div>
    );
  }

  const completedDate = course.enrollment.completedAt
    ? new Date(course.enrollment.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-12 px-4">
      <div className="no-print mb-6 flex gap-3">
        <Button onClick={() => window.print()} data-testid="button-print-certificate">
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>
        <Button variant="outline" onClick={() => window.close()}>Close</Button>
      </div>

      <div
        className="certificate-page bg-white shadow-xl rounded-lg w-full max-w-3xl p-12 text-center relative"
        data-testid="certificate-container"
        style={{ border: `8px solid ${NAMC_GOLD}`, fontFamily: "Georgia, serif" }}
      >
        <div className="absolute inset-2 border-2 border-amber-200 rounded pointer-events-none" />

        <div className="mb-6">
          <div
            className="inline-block px-4 py-1 mb-4 text-xs font-semibold uppercase tracking-widest rounded"
            style={{ backgroundColor: NAMC_GOLD, color: "#fff" }}
          >
            Certificate of Completion
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>
            NAMC NorCal
          </h1>
          <p className="text-sm text-gray-500 mt-1">National Association of Minority Contractors — Northern California Chapter</p>
        </div>

        <div className="my-8">
          <p className="text-lg text-gray-600 mb-4">This certifies that</p>
          <p
            className="text-2xl sm:text-3xl font-bold mb-4 break-words max-w-full"
            style={{ color: NAMC_GOLD, borderBottom: `2px solid ${NAMC_GOLD}`, display: "inline-block", paddingBottom: "8px" }}
            data-testid="certificate-recipient"
          >
            {user?.username || "NAMC Member"}
          </p>
          <p className="text-lg text-gray-600 mt-4 mb-2">has successfully completed</p>
          <h2 className="text-2xl font-bold text-gray-900 my-2" data-testid="certificate-course-title">
            {course.title}
          </h2>
          {course.description && (
            <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">{course.description}</p>
          )}
        </div>

        <div className="mt-10 mb-4">
          <p className="text-sm text-gray-500">Awarded on</p>
          <p className="text-base font-semibold text-gray-700 mt-1" data-testid="certificate-date">{completedDate}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-around items-center sm:items-end gap-6 sm:gap-4 mt-10 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="h-0.5 w-32 sm:w-40 bg-gray-400 mb-1 mx-auto" />
            <p className="text-xs text-gray-500">Executive Director</p>
            <p className="text-xs font-medium text-gray-700">NAMC NorCal</p>
          </div>
          <div className="text-center">
            <div className="h-0.5 w-32 sm:w-40 bg-gray-400 mb-1 mx-auto" />
            <p className="text-xs text-gray-500">Training Director</p>
            <p className="text-xs font-medium text-gray-700">NAMC NorCal</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .certificate-page { box-shadow: none !important; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
