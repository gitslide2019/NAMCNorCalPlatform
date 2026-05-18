import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";

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
    <div className="certificate-screen min-h-screen bg-neutral-100 flex flex-col items-center justify-start py-12 px-4">
      <div className="no-print mb-6 flex gap-3">
        <Button onClick={() => window.print()} data-testid="button-print-certificate">
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>
        <Button variant="outline" onClick={() => window.close()}>Close</Button>
      </div>

      <article
        className="certificate-page"
        data-testid="certificate-container"
      >
        <div className="certificate-inner-border" aria-hidden />

        <header className="certificate-header">
          <div className="certificate-eyebrow">Certificate of Completion</div>
          <div className="certificate-numeral">№ 01</div>
          <h1 className="certificate-org font-display">NAMC NorCal</h1>
          <p className="certificate-org-sub">National Association of Minority Contractors — Northern California Chapter</p>
        </header>

        <section className="certificate-body">
          <p className="certificate-label">This certifies that</p>
          <p className="certificate-recipient font-display" data-testid="certificate-recipient">
            {user?.username || "NAMC Member"}
          </p>
          <p className="certificate-label">has successfully completed</p>
          <h2 className="certificate-course font-display" data-testid="certificate-course-title">
            {course.title}
          </h2>
          {course.description && (
            <p className="certificate-description">{course.description}</p>
          )}
        </section>

        <section className="certificate-awarded">
          <p className="certificate-label">Awarded on</p>
          <p className="certificate-date font-numeral" data-testid="certificate-date">{completedDate}</p>
        </section>

        <footer className="certificate-signatures">
          <div className="certificate-signature">
            <div className="certificate-signature-line" />
            <p className="certificate-signature-role">Executive Director</p>
            <p className="certificate-signature-org">NAMC NorCal</p>
          </div>
          <div className="certificate-signature">
            <div className="certificate-signature-line" />
            <p className="certificate-signature-role">Training Director</p>
            <p className="certificate-signature-org">NAMC NorCal</p>
          </div>
        </footer>
      </article>

      <style>{`
        .certificate-page {
          background: #ffffff;
          color: #1a1a1a;
          width: 100%;
          max-width: 60rem;
          aspect-ratio: 11 / 8.5;
          padding: 3.5rem 3.5rem 2.75rem;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          border: 10px solid #FFD700;
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          display: flex;
          flex-direction: column;
          text-align: center;
        }
        .certificate-inner-border {
          position: absolute;
          inset: 10px;
          border: 1.5px solid rgba(255, 215, 0, 0.45);
          pointer-events: none;
        }
        .certificate-header { margin-bottom: 1.25rem; position: relative; }
        .certificate-eyebrow {
          display: inline-block;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
          color: #1a1a1a;
          padding: 0.35rem 0.85rem;
          background: #FFD700;
          margin-bottom: 1rem;
        }
        .certificate-numeral {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
          font-size: 0.85rem;
          color: #FFD700;
          margin-bottom: 0.5rem;
        }
        .certificate-org {
          font-size: 2.25rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.1;
          color: #1a1a1a;
        }
        .certificate-org-sub {
          font-size: 0.85rem;
          color: #555;
          margin-top: 0.35rem;
        }
        .certificate-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.75rem;
        }
        .certificate-label {
          font-size: 0.95rem;
          color: #555;
          font-weight: 500;
        }
        .certificate-recipient {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #1a1a1a;
          display: inline-block;
          padding: 0.25rem 0 0.6rem;
          margin: 0 auto;
          border-bottom: 2px solid #FFD700;
          max-width: 90%;
          word-break: break-word;
        }
        .certificate-course {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #1a1a1a;
          margin-top: 0.25rem;
        }
        .certificate-description {
          font-size: 0.875rem;
          color: #666;
          max-width: 36rem;
          margin: 0.25rem auto 0;
          line-height: 1.5;
        }
        .certificate-awarded { margin-top: 1.5rem; }
        .certificate-date {
          font-size: 1.05rem;
          color: #1a1a1a;
          margin-top: 0.2rem;
        }
        .certificate-signatures {
          margin-top: 2rem;
          padding-top: 1.25rem;
          border-top: 1px solid #e5e5e5;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          gap: 1rem;
        }
        .certificate-signature { text-align: center; }
        .certificate-signature-line {
          height: 1.5px;
          width: 11rem;
          background: #999;
          margin: 0 auto 0.35rem;
        }
        .certificate-signature-role {
          font-size: 0.75rem;
          color: #555;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .certificate-signature-org {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 0.1rem;
        }

        @media (max-width: 640px) {
          .certificate-page {
            aspect-ratio: auto;
            padding: 2rem 1.5rem;
          }
          .certificate-org { font-size: 1.75rem; }
          .certificate-recipient { font-size: 1.75rem; }
          .certificate-course { font-size: 1.35rem; }
          .certificate-signatures {
            flex-direction: column;
            gap: 1.25rem;
            align-items: center;
          }
        }

        @page {
          size: letter landscape;
          margin: 0.4in;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .certificate-screen {
            background: #ffffff !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .certificate-page {
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
            height: 100vh;
            aspect-ratio: auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 0 !important;
          }
          .certificate-signatures {
            flex-direction: row !important;
          }
        }
      `}</style>
    </div>
  );
}
