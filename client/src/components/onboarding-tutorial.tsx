import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  Rocket,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import namcLogo from "@assets/NAMC-Logo_Small-BlackYellow__1769738977811.jpg";

const STORAGE_KEY = "namc-onboarding-dismissed";

const steps = [
  {
    icon: null,
    useLogo: true,
    title: "Welcome to NAMC NorCal!",
    description:
      "Welcome to your Member Portal — your hub for networking, project opportunities, and professional development. Let's take a quick tour.",
  },
  {
    icon: LayoutDashboard,
    title: "Your Dashboard",
    description:
      "This is your home base. See your membership status, company info, and stay up to date with the latest activity — unread messages, upcoming events, and open project opportunities.",
  },
  {
    icon: Users,
    title: "Find Fellow Contractors",
    description:
      "Use the Member Directory to connect with 50+ NAMC member companies across Northern California. Search by company name, services, or membership category.",
  },
  {
    icon: Briefcase,
    title: "Bid on Projects",
    description:
      "Check Projects for new contracting opportunities posted by NAMC. View project details, budgets, and deadlines — then submit your bid directly through the portal.",
  },
  {
    icon: MessageSquare,
    title: "Stay Connected",
    description:
      "Send private Messages to other members, join community Discussions, check the Calendar for upcoming events, and browse Newsletters for the latest NAMC news.",
  },
  {
    icon: Rocket,
    title: "You're All Set!",
    description:
      "Start by updating your Profile so other members can find you, then explore the portal. You can restart this tour anytime from the Dashboard.",
  },
];

interface OnboardingTutorialProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function OnboardingTutorial({ forceOpen, onClose }: OnboardingTutorialProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setVisible(true);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, [forceOpen]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    onClose?.();
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="onboarding-overlay">
      <div className="bg-card rounded-xl shadow-2xl border max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-onboarding-skip"
          aria-label="Skip tour"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            {current.useLogo ? (
              <img src={namcLogo} alt="NAMC NorCal" className="h-12 w-12 object-contain rounded-lg" />
            ) : Icon ? (
              <Icon className="h-8 w-8 text-primary" />
            ) : null}
          </div>

          <h2 className="text-xl font-bold mb-2" data-testid="text-onboarding-title">
            {current.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6" data-testid="text-onboarding-description">
            {current.description}
          </p>

          <div className="flex items-center gap-1.5 mb-6" data-testid="onboarding-step-dots">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === step ? "w-6 bg-primary" : "w-2 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 w-full">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={back}
                className="flex-1"
                data-testid="button-onboarding-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={next}
              className="flex-1"
              data-testid="button-onboarding-next"
            >
              {isLast ? "Start Exploring" : "Next"}
              {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>

          {step === 0 && (
            <button
              onClick={dismiss}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-onboarding-skip-text"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useOnboardingReset() {
  const [forceOpen, setForceOpen] = useState(false);

  const restartTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setForceOpen(true);
  };

  const onClose = () => {
    setForceOpen(false);
  };

  return { forceOpen, restartTour, onClose };
}
