import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MessageSquare, ShieldCheck, Ban, HelpCircle } from "lucide-react";

export default function SmsTerms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-8 w-8 text-primary" data-testid="icon-sms" />
            <h1 className="text-3xl font-bold" data-testid="heading-sms-terms">
              SMS Communications &amp; Consent
            </h1>
          </div>

          <p className="text-muted-foreground mb-8" data-testid="text-intro">
            The National Association of Minority Contractors, Northern California
            Chapter ("NAMC NorCal") sends SMS text messages to members and
            contractors who have opted in to receive them. This page explains how
            you opt in, what you can expect, and how to opt out.
          </p>

          <section className="mb-8" data-testid="section-opt-in">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              How You Opt In
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              You give consent to receive SMS messages from NAMC NorCal in any of
              the following ways:
            </p>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
              <li>
                Submitting a membership application on{" "}
                <a
                  href="https://www.namcnorcal.org"
                  className="underline"
                  data-testid="link-namc-site"
                >
                  namcnorcal.org
                </a>{" "}
                or this member portal and providing a mobile phone number.
              </li>
              <li>
                Providing your phone number on a NAMC NorCal event registration,
                project interest form, or partner intake form.
              </li>
              <li>
                Texting a NAMC NorCal keyword or replying <strong>YES</strong> to
                a confirmation message from us.
              </li>
              <li>
                Being added to NAMC NorCal's contractor outreach list as a
                licensed Bay Area contractor and giving verbal or written
                consent to a NAMC NorCal staff member.
              </li>
            </ul>
          </section>

          <section className="mb-8" data-testid="section-message-types">
            <h2 className="text-xl font-semibold mb-3">What Messages You'll Receive</h2>
            <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
              <li>Membership account notifications (renewals, application status, password resets).</li>
              <li>Project opportunity alerts (RFPs, bid invitations, partnership openings).</li>
              <li>Event reminders for trainings, meetings, and chapter events.</li>
              <li>Important announcements from NAMC NorCal leadership.</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Message frequency varies — typically 5 to 20 messages per month.
              Message and data rates may apply per your mobile carrier plan.
            </p>
          </section>

          <section className="mb-8" data-testid="section-opt-out">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Ban className="h-5 w-5 text-primary" />
              How to Opt Out
            </h2>
            <p className="text-sm text-muted-foreground">
              Reply <strong>STOP</strong> to any NAMC NorCal SMS message at any
              time. You will receive one final confirmation message and then no
              further texts. To opt back in, reply <strong>START</strong> or
              contact us at the email below.
            </p>
          </section>

          <section className="mb-8" data-testid="section-help">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help &amp; Contact
            </h2>
            <p className="text-sm text-muted-foreground">
              Reply <strong>HELP</strong> to any message for support, or reach
              us directly:
            </p>
            <ul className="list-none pl-0 text-sm text-muted-foreground mt-3 space-y-1">
              <li>
                Email:{" "}
                <a
                  href="mailto:info@namcnorcal.org"
                  className="underline"
                  data-testid="link-contact-email"
                >
                  info@namcnorcal.org
                </a>
              </li>
              <li>
                Address: National Association of Minority Contractors, Northern
                California Chapter, 8066 Collins Dr, Oakland, CA 94605
              </li>
            </ul>
          </section>

          <section className="mb-4" data-testid="section-privacy">
            <h2 className="text-xl font-semibold mb-3">Privacy</h2>
            <p className="text-sm text-muted-foreground">
              NAMC NorCal does not sell, rent, or share your mobile phone number
              or SMS opt-in data with third parties or affiliates for marketing
              purposes. Phone numbers and consent records are used solely to
              deliver the messages described above.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
