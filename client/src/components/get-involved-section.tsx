import { 
  Users, 
  Award, 
  Heart, 
  GraduationCap,
  MessageSquare,
  Building,
  UsersRound,
  FileText,
  Megaphone,
  HandHeart,
  School,
  Hammer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const involvementAreas = [
  {
    title: "Network",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    items: [
      "Participate in local NAMC membership meetings",
      "Meet legislators, agency officials, and A/E/C professionals during Legislative Day",
      "Attend Members Only programs",
      "Use Directory to find other members for your projects",
      "Get acquainted with industry peers during a class or meeting",
      "Attend National conferences"
    ]
  },
  {
    title: "Recognize & Promote",
    icon: Award,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    items: [
      "Use NAMC logos on job sites, in marketing materials, proposals/bids, and on your website",
      "Take advantage of sponsorship opportunities",
      "Advertise on the Chapter website and other publications",
      "Nominate colleagues or projects for annual Hard Hat Awards"
    ]
  },
  {
    title: "Give Back",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    items: [
      "Be a mentor",
      "Share project opportunity information with membership",
      "Volunteer on a Chapter Committee",
      "Help with a community service construction project",
      "Volunteer to teach a class or serve on a program panel"
    ]
  },
  {
    title: "Develop Workforce",
    icon: GraduationCap,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    items: [
      "Volunteer to speak about construction as a career choice at local schools",
      "Exhibit and/or sponsor during our job fair event",
      "Host student field trips on your job sites",
      "Support our Student Chapter",
      "Explore ways to support NAMC's iConstruction Pre-apprenticeship Program"
    ]
  }
];

export function GetInvolvedSection() {
  return (
    <section id="get-involved" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-get-involved-title">
            Ways to Get Involved
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Once you and your company become a member, there are numerous services, programs, and opportunities 
            for you to learn about, benefit from, and participate in. The best way to maximize your member 
            experience is by finding multiple ways to stay involved!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {involvementAreas.map((area, index) => (
            <Card key={index} data-testid={`card-involvement-${area.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${area.bgColor}`}>
                    <area.icon className={`h-6 w-6 ${area.color}`} />
                  </div>
                  <CardTitle className="text-xl">{area.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {area.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-card rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Members often choose to volunteer time and expertise by serving on one of our committees, 
            task forces or boards. Contact our office at{" "}
            <a href="mailto:info@namcnorcal.org" className="text-primary font-medium hover:underline">
              info@namcnorcal.org
            </a>{" "}
            for more information.
          </p>
        </div>
      </div>
    </section>
  );
}
