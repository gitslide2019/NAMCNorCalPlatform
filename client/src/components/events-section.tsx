import { Calendar, Users, Award, Utensils, PartyPopper, HeartHandshake, Trophy, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const events = [
  { month: "January", events: ["Board of Directors Meeting"], icon: Users },
  { month: "February", events: ["General Membership Meeting", "Construction Talk & Acknowledgement Ceremony", "Fundraiser Event"], icon: Award },
  { month: "March", events: ["Job Fair / Workforce Development Day", "General Membership Day"], icon: HeartHandshake },
  { month: "April", events: ["Spring Golf Tournament or Bowling", "General Membership Meeting"], icon: Trophy },
  { month: "May", events: ["Summer Kick-Off Cookout", "General Membership Meeting"], icon: Utensils },
  { month: "June", events: ["Member Mixer", "Annual Conference"], icon: PartyPopper },
  { month: "July", events: ["NAMC Meet & Greet Mixer", "General Membership Meeting"], icon: Users },
  { month: "August", events: ["Community Service Day", "General Membership Meeting"], icon: HeartHandshake },
  { month: "September", events: ["Fall Golf Tournament", "General Membership Meeting"], icon: Trophy },
  { month: "October", events: ["Hard Hat Awards Banquet", "General Membership Meeting"], icon: Award },
  { month: "November", events: ["Membership Drive Meet & Greet"], icon: Users },
  { month: "December", events: ["Holiday Casino Night"], icon: Gamepad2 }
];

export function EventsSection() {
  return (
    <section id="events" className="py-20 sm:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Calendar className="h-4 w-4" />
            <span>Annual Calendar</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-events-title">
            Annual Calendar of Major Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join us throughout the year for networking, professional development, and community events.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((item, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-event-${item.month.toLowerCase()}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">{item.month}</Badge>
                </div>
                <ul className="space-y-2">
                  {item.events.map((event, eventIndex) => (
                    <li key={eventIndex} className="text-sm text-muted-foreground">
                      {event}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
