import { drizzle } from "drizzle-orm/node-postgres";
import { sql, eq } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import { users, membershipApplications, calendarEvents, newsletters, tools, courses, lessons, discussionTopics, projectOpportunities } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { seedMemberData } from "./seed-members";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

const scryptAsync = promisify(scrypt);

export async function ensureAdminUser() {
  try {
    const [existing] = await db.select().from(users).where(eq(users.username, "testadmin"));
    if (!existing) {
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("test1234", salt, 64)) as Buffer;
      const hashedPassword = buf.toString("hex") + "." + salt;
      await db.insert(users).values({
        username: "testadmin",
        password: hashedPassword,
        isAdmin: true,
      });
      console.log("Created testadmin user");
    } else {
      console.log("testadmin user already exists");
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
}

export async function seedMembers() {
  try {
    console.log("Checking member seed data...");
    const result = await db.select({ count: sql<number>`count(*)` }).from(membershipApplications);
    const count = Number(result[0]?.count || 0);
    console.log(`Current membership_applications count: ${count}`);
    if (count === 0) {
      console.log(`Inserting ${seedMemberData.length} seed members...`);
      for (const member of seedMemberData) {
        await db.insert(membershipApplications).values(member as any);
      }
      console.log(`Seeded ${seedMemberData.length} member applications successfully`);
    } else {
      console.log(`Skipping seed - ${count} members already exist`);
    }
  } catch (error) {
    console.error("Error seeding members:", error);
  }
}

export async function seedMemberAccounts() {
  try {
    console.log("Checking member user accounts...");
    const memberAccounts = [
      { username: "james.jackson", companyName: "Digital Disclosure AV" },
      { username: "tana.harris", companyName: "Harris Hoisting" },
      { username: "bruce.giron", companyName: "Giron Construction" },
      { username: "bianca.johnson", companyName: "Turner Construction" },
      { username: "kimberly.wilson", companyName: "Port of Oakland" },
    ];

    for (const account of memberAccounts) {
      const [existing] = await db.select().from(users).where(eq(users.username, account.username));
      if (existing) continue;

      const [app] = await db.select().from(membershipApplications).where(eq(membershipApplications.companyName, account.companyName));
      if (!app) {
        console.log(`Skipping ${account.username} - no application found for ${account.companyName}`);
        continue;
      }

      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("member123", salt, 64)) as Buffer;
      const hashedPassword = buf.toString("hex") + "." + salt;
      await db.insert(users).values({
        username: account.username,
        password: hashedPassword,
        isAdmin: false,
        memberApplicationId: app.id,
      });
      console.log(`Created member account: ${account.username} (${account.companyName} - ${app.membershipCategory})`);
    }
  } catch (error) {
    console.error("Error seeding member accounts:", error);
  }
}

export async function seedSampleContent() {
  try {
    console.log("Checking sample content...");
    
    const [adminUser] = await db.select().from(users).where(eq(users.username, "testadmin"));
    if (!adminUser) {
      console.log("No admin user found, skipping sample content");
      return;
    }
    const adminId = adminUser.id;

    const eventCount = await db.select({ count: sql<number>`count(*)` }).from(calendarEvents);
    if (Number(eventCount[0]?.count || 0) === 0) {
      await db.insert(calendarEvents).values([
        { title: "NAMC NorCal Monthly General Meeting", description: "Join us for our monthly general membership meeting. We'll discuss upcoming projects, member updates, and networking opportunities. Light refreshments will be served.", eventDate: "2026-03-15", eventTime: "10:00", location: "NAMC NorCal Office, 977 66th Ave, Oakland, CA 94621", createdById: adminId },
        { title: "Construction Workforce Development Workshop", description: "A hands-on workshop focused on developing skills for the next generation of minority contractors. Topics include estimating, project management, and safety compliance.", eventDate: "2026-03-22", eventTime: "09:00", location: "Laney College, 900 Fallon St, Oakland, CA 94607", createdById: adminId },
        { title: "Networking Mixer & Happy Hour", description: "Connect with fellow NAMC members and industry partners in a casual setting. Great opportunity to build relationships and explore potential collaborations.", eventDate: "2026-04-05", eventTime: "17:30", location: "The Lodge at Lake Merritt, Oakland, CA", createdById: adminId },
        { title: "Certification Prep: DBE/MBE Application Workshop", description: "Step-by-step guidance on completing DBE and MBE certification applications. Bring your documents and get personalized help from experienced members.", eventDate: "2026-04-12", eventTime: "13:00", location: "NAMC NorCal Office, 977 66th Ave, Oakland, CA 94621", createdById: adminId },
        { title: "Annual NAMC NorCal Golf Tournament", description: "Our annual fundraiser golf tournament! All proceeds support NAMC NorCal scholarship programs and workforce development initiatives. Includes lunch, prizes, and networking.", eventDate: "2026-05-10", eventTime: "08:00", location: "Metropolitan Golf Links, 10051 Doolittle Dr, Oakland, CA 94603", createdById: adminId },
        { title: "Safety Training: OSHA 10-Hour Construction", description: "Free OSHA 10-hour construction safety training for NAMC members. Limited seats available. Participants receive OSHA 10-hour card upon completion.", eventDate: "2026-04-19", eventTime: "08:00", location: "Carpenters Training Center, Pleasanton, CA", createdById: adminId },
      ]);
      console.log("Seeded 6 calendar events");
    }

    const nlCount = await db.select({ count: sql<number>`count(*)` }).from(newsletters);
    if (Number(nlCount[0]?.count || 0) === 0) {
      await db.insert(newsletters).values([
        { title: "NAMC NorCal Quarterly Newsletter", content: "## A Message from Our President\n\n\"NAMC NorCal is the go-to contractor implementation organization in Northern California. We are governed by active contractors FOR active contractors, focusing purely on delivery and moving beyond advocacy to execute actual contracts.\"\n\n---\n\n## Why Join or Invest in NAMC NorCal?\n\n### For Contractors: Win More Work\n\n- **Direct Access**: We are the only organization in the region focused purely on contract delivery.\n- **Networking**: Connect directly with decision-makers at major GCs and agencies.\n- **Growth**: Access specialized training like the Turner Construction School or CRC Project Management.\n\n### For Sponsors: Reach the Right Partners\n\n- **Pipeline Access**: Gain visibility with a vetted network of active, delivery-focused minority contractors.\n- **Community Impact**: Support workforce funding and inclusion at the policy level.\n- **Strategic Branding**: Align with key regional events and legislative advocacy.\n\n---\n\n## This Quarter's Top Stories\n\n### Recap: 100 Years of Black History\n\nOn February 26, we celebrated a century of Black History in partnership with the OAACC, the City of Oakland, and PG&E.\n\n---\n\n## Upcoming Events & Opportunities\n\n| Date | Event / Opportunity | Description |\n| --- | --- | --- |\n| **Feb 26** | **Turner Construction Mixer** | Connect with Turner's team at their new Walnut Creek office regarding upcoming projects. |\n| **Mar 11** | **AGC Women Build CA Summit** | Actionable tools for talent retention and industry opportunity in Santa Clara. |\n| **Mar 24** | **NAMC NY Unity Gala** | Join our partners in New York for their annual gala. |\n| **March** | **Turner Construction School** | New class session begins; highly recommended for networking and technical growth. |\n| **Ongoing** | **CRC Project Management** | 10-week course focusing on energy efficiency and AI. |\n| **Ongoing** | **RFP opportunities with the City of East Palo Alto** | Opportunity to contract directly with the City and begin monitoring future RFP releases. |\n\n---\n\n## Member & Partner Spotlights\n\n- **New Swag**: Big thanks to board member **Mark Hall** for our new merch! Visit our website to order hoodies, mugs, or bags for your team — funds help spread the word.\n- **In the Field**: Member **Sean Paul Guess** is currently participating in the CRC Project Management course; reach out to him with questions.\n- **Resource Launch**: We are developing a **Contractors Support Resource Guide** covering cash-flow financing and technical education. **We need your quotes!** Share your real-life experiences to be featured.\n\n---\n\n## Call to Action\n\n- **Visit Our New Website**: We've updated our links for easier membership renewal and merch access.\n- **Get Involved**: Reach out to **Shannon** or any **NAMC Board member** to connect with these opportunities.\n\n**NAMC NOR CAL** | 977 66th Ave, Oakland, CA 94621 | info@namcnorcal.org", createdById: adminId },
        { title: "February 2026 Member Update", content: "Hello NAMC NorCal Family,\n\nHere are the highlights from February:\n\nMember Spotlight: 5D Construction Containment Services\nCongratulations to Amir Jenkins and the 5D Construction team for being featured as our Member Spotlight this month. Their work in environmental containment services continues to set the standard in the industry.\n\nPolicy Update\nThe California Legislature is considering new legislation that would increase DBE participation goals on state-funded projects. NAMC NorCal is actively advocating for our members' interests. We will keep you updated on developments.\n\nTool Lending Library\nWe have launched a new Tool Lending Library for members! You can now borrow specialized construction tools and equipment through the member portal. Check availability and reserve tools online.\n\nNetworking Success\nOur January networking event brought together over 40 member companies and resulted in several new subcontracting partnerships. If you missed it, don't worry — our next mixer is coming in April.\n\nReminder: Dues\nAnnual membership dues are now being accepted for the 2026-2027 fiscal year. Log in to your portal to view your membership tier and payment status.\n\nThank you for your continued support.\n\nNAMC NorCal Team", createdById: adminId },
        { title: "Welcome to the NAMC NorCal Member Portal!", content: "Dear Members,\n\nWe are thrilled to launch the new NAMC NorCal Member Portal! This platform has been designed to strengthen our community and provide you with valuable resources.\n\nWhat You Can Do:\n\n1. Member Directory - Browse and connect with all approved NAMC NorCal member companies. Search by name, category, or certifications.\n\n2. Messages - Send direct messages to other members for networking, collaboration, and project inquiries.\n\n3. Discussion Boards - Join conversations on industry topics, share best practices, and ask questions.\n\n4. Project Opportunities - View open project opportunities and submit bids directly through the portal.\n\n5. Calendar - Stay up to date on NAMC events, workshops, and networking mixers.\n\n6. Tool Lending Library - Borrow tools and equipment from our shared library.\n\n7. Learning Center - Access courses and training materials to grow your skills.\n\nWe encourage you to explore all the features and reach out to us at info@namcnorcal.org if you have any questions.\n\nTogether we build!\n\nNAMC NorCal", createdById: adminId },
      ]);
      console.log("Seeded 3 newsletters");
    }

    const toolCount = await db.select({ count: sql<number>`count(*)` }).from(tools);
    if (Number(toolCount[0]?.count || 0) === 0) {
      await db.insert(tools).values([
        { name: "Laser Level (Bosch GLL3-330CG)", description: "360-degree green beam laser level with Bluetooth connectivity. Ideal for interior layout, framing, and tile work. Includes carrying case and batteries.", category: "measurement", ownerId: adminId, status: "available" },
        { name: "Rotary Hammer Drill (Hilti TE 7-C)", description: "SDS-plus rotary hammer drill for drilling and light chiseling in concrete, masonry, and natural stone. Includes depth gauge and carrying case.", category: "power-tools", ownerId: adminId, status: "available" },
        { name: "Concrete Moisture Meter", description: "Pin-type moisture meter for testing concrete slabs before flooring installation. Digital display with hold function. Essential for flooring contractors.", category: "measurement", ownerId: adminId, status: "available" },
        { name: "Pipe Threader Set (Ridgid 12-R)", description: "Manual ratchet pipe threader set with dies for 1/2\" to 2\" pipe. Heavy-duty construction. Perfect for plumbing contractors.", category: "hand-tools", ownerId: adminId, status: "available" },
        { name: "Scaffolding Set (6ft Baker)", description: "Rolling baker scaffold, 6ft platform height. Includes guardrails, outriggers, and locking casters. 1000 lb capacity. Great for painting and drywall work.", category: "safety", ownerId: adminId, status: "available" },
        { name: "Conduit Bender (Greenlee 1818)", description: "Mechanical conduit bender for 1/2\" to 1\" EMT. Includes handle and foot pedal. Durable aluminum construction.", category: "hand-tools", ownerId: adminId, status: "available" },
        { name: "Thermal Imaging Camera (FLIR C5)", description: "Compact thermal camera for detecting insulation gaps, moisture issues, and electrical hotspots. Wi-Fi enabled with cloud storage.", category: "measurement", ownerId: adminId, status: "available" },
        { name: "Demolition Hammer (Bosch 11335K)", description: "35 lb. demolition hammer for heavy-duty concrete and masonry removal. Includes carrying case and two chisels.", category: "power-tools", ownerId: adminId, status: "borrowed" },
        { name: "Safety Harness Kit (3M Protecta)", description: "Full-body safety harness with 6-foot shock-absorbing lanyard. OSHA compliant. Adjustable fit up to 310 lbs.", category: "safety", ownerId: adminId, status: "available" },
        { name: "Table Saw (DeWalt DWE7491RS)", description: "10-inch job site table saw with rolling stand. 32-1/2\" rip capacity. Includes fence, miter gauge, and blade guard.", category: "power-tools", ownerId: adminId, status: "available" },
      ]);
      console.log("Seeded 10 tools");
    }

    const courseCount = await db.select({ count: sql<number>`count(*)` }).from(courses);
    if (Number(courseCount[0]?.count || 0) === 0) {
      const [course1] = await db.insert(courses).values({ title: "Construction Estimating Fundamentals", description: "Learn the essential skills of construction cost estimating. This course covers quantity takeoffs, labor and material pricing, overhead calculations, and bid preparation for residential and commercial projects.", createdById: adminId }).returning();
      await db.insert(lessons).values([
        { courseId: course1.id, title: "Introduction to Construction Estimating", content: "Welcome to Construction Estimating Fundamentals!\n\nIn this course, you'll learn the core principles of preparing accurate construction estimates. Whether you're bidding on your first project or looking to sharpen your skills, this course will give you the foundation you need.\n\nWhat is Construction Estimating?\nConstruction estimating is the process of forecasting the cost of building a physical structure. Accurate estimating is critical for:\n- Winning competitive bids\n- Maintaining profitability\n- Building trust with clients\n- Planning resources effectively\n\nTypes of Estimates:\n1. Preliminary Estimate - A rough cost based on similar past projects\n2. Detailed Estimate - A thorough cost breakdown using quantity takeoffs\n3. Bid Estimate - The final estimate submitted for competitive bidding\n\nIn the next lessons, we'll dive into each of these in detail.", sortOrder: 1 },
        { courseId: course1.id, title: "Quantity Takeoffs", content: "Quantity takeoffs are the foundation of any detailed estimate.\n\nWhat is a Quantity Takeoff?\nA quantity takeoff (QTO) is the process of measuring and listing all materials needed for a construction project from the plans and specifications.\n\nKey Steps:\n1. Review the drawings and specifications thoroughly\n2. Organize by CSI division (concrete, masonry, metals, etc.)\n3. Measure each item systematically\n4. Use consistent units of measurement\n5. Account for waste factors (typically 5-10%)\n\nCommon Measurement Units:\n- Linear feet (LF) - for pipes, conduit, baseboards\n- Square feet (SF) - for flooring, painting, roofing\n- Cubic yards (CY) - for concrete, excavation\n- Each (EA) - for fixtures, doors, windows\n\nTips for Accuracy:\n- Always double-check your math\n- Use colored pencils to mark items as you count them\n- Note any ambiguities to clarify with the architect\n- Keep a running checklist to avoid missing items", sortOrder: 2 },
        { courseId: course1.id, title: "Labor and Material Pricing", content: "Once you have your quantities, the next step is applying costs.\n\nMaterial Pricing:\n- Get current pricing from your suppliers\n- Account for delivery charges\n- Factor in sales tax\n- Consider bulk discounts for large quantities\n- Include waste allowance\n\nLabor Pricing:\n- Determine crew composition (journeyman, apprentice, helper)\n- Calculate production rates (units installed per hour)\n- Apply prevailing wage rates for public works projects\n- Include labor burden (taxes, insurance, benefits) — typically 30-40% above base wage\n\nSubcontractor Pricing:\n- Get at least 3 quotes for each trade\n- Review scope carefully to avoid gaps\n- Include time for coordination\n\nSample Calculation:\nConcrete flatwork, 1000 SF:\n- Material: $4.50/SF = $4,500\n- Labor: 4-person crew x 8 hours x $65/hr avg = $2,080\n- Equipment: pump truck rental = $800\n- Subtotal: $7,380\n- Waste (5%): $369\n- Total: $7,749", sortOrder: 3 },
        { courseId: course1.id, title: "Overhead and Profit", content: "Understanding overhead and profit is essential to building a sustainable business.\n\nDirect Costs vs. Indirect Costs:\n- Direct costs: materials, labor, equipment directly tied to the project\n- Indirect costs (overhead): office rent, insurance, vehicles, admin staff, licenses\n\nCalculating Overhead:\n1. Add up all annual overhead expenses\n2. Divide by your annual revenue to get an overhead rate\n3. Typical overhead rates: 10-20% for small contractors\n\nProfit Margin:\n- Profit is NOT the same as your salary\n- Profit is the return on your investment and risk\n- Typical profit margins: 5-15% depending on project type and risk\n- Higher risk = higher profit margin needed\n\nMarkup Formula:\nTotal Bid = Direct Costs + (Direct Costs × Overhead %) + (Direct Costs × Profit %)\n\nExample:\n- Direct Costs: $100,000\n- Overhead (15%): $15,000\n- Profit (10%): $10,000\n- Total Bid: $125,000", sortOrder: 4 },
      ]);

      const [course2] = await db.insert(courses).values({ title: "DBE/MBE Certification Guide", description: "A comprehensive guide to obtaining and maintaining Disadvantaged Business Enterprise (DBE) and Minority Business Enterprise (MBE) certifications. Learn eligibility requirements, application procedures, and how to leverage your certifications.", createdById: adminId }).returning();
      await db.insert(lessons).values([
        { courseId: course2.id, title: "Understanding DBE and MBE Certifications", content: "What are DBE and MBE Certifications?\n\nDBE (Disadvantaged Business Enterprise):\n- A federal certification program administered by the U.S. Department of Transportation\n- Required for federally-funded transportation projects\n- Provides access to contracting opportunities with state DOTs, transit agencies, and airports\n\nMBE (Minority Business Enterprise):\n- Certifications offered by various state and local agencies\n- Recognizes businesses owned and controlled by minority individuals\n- Opens doors to public and private sector opportunities\n\nWhy Get Certified?\n1. Access to set-aside contracts\n2. Participation goals on public projects\n3. Networking with prime contractors seeking DBE/MBE partners\n4. Technical assistance and mentoring programs\n5. Business development resources\n\nEligibility Requirements:\n- At least 51% owned by socially and economically disadvantaged individuals\n- Business owner must have personal net worth below $1.32 million (DBE)\n- Owner must control day-to-day operations\n- Firm must be a small business (SBA size standards)", sortOrder: 1 },
        { courseId: course2.id, title: "Application Process Step-by-Step", content: "Preparing Your Application:\n\nStep 1: Gather Required Documents\n- Personal tax returns (3 years)\n- Business tax returns (3 years)\n- Business financial statements\n- Articles of incorporation/organization\n- Operating agreement or bylaws\n- Resumes of all owners\n- Licenses and certifications\n- Loan agreements\n- Lease agreements\n\nStep 2: Complete the Application Form\n- Apply through your state's Unified Certification Program (UCP)\n- In California: CalTrans DBE program or local certifying agencies\n- Be thorough and accurate — incomplete applications are delayed\n\nStep 3: Submit and Follow Up\n- Allow 60-90 days for processing\n- Be responsive to requests for additional information\n- Prepare for a site visit\n\nStep 4: Maintain Certification\n- File annual no-change affidavit\n- Report any changes in ownership or control\n- Recertify as required (typically every 3-5 years)\n\nCommon Mistakes to Avoid:\n- Incomplete documentation\n- Inconsistencies between documents\n- Not demonstrating control of operations\n- Missing filing deadlines", sortOrder: 2 },
        { courseId: course2.id, title: "Leveraging Your Certification", content: "Now that you're certified, how do you make the most of it?\n\nFinding Opportunities:\n1. Register on procurement portals (SAM.gov, state procurement sites)\n2. Attend pre-bid meetings and industry days\n3. Connect with prime contractors through NAMC NorCal\n4. Monitor bid boards for projects with DBE/MBE goals\n\nBuilding Relationships:\n- Attend NAMC networking events\n- Introduce yourself to prime contractors at pre-bid meetings\n- Follow up promptly with capability statements\n- Deliver quality work to build your reputation\n\nCapability Statement:\nEvery certified firm should have a professional capability statement including:\n- Company overview\n- Core competencies\n- Past performance/project experience\n- Certifications held\n- Contact information\n- NAICS codes\n\nGrowing Your Business:\n- Start with smaller subcontracting roles\n- Build relationships and track record\n- Gradually take on larger scopes\n- Mentor other minority contractors coming up behind you", sortOrder: 3 },
      ]);

      const [course3] = await db.insert(courses).values({ title: "Construction Safety Essentials", description: "Essential safety training for construction professionals. Covers OSHA requirements, hazard identification, fall protection, and creating a culture of safety on your job sites.", createdById: adminId }).returning();
      await db.insert(lessons).values([
        { courseId: course3.id, title: "OSHA Requirements Overview", content: "Construction Safety Starts with OSHA\n\nOSHA (Occupational Safety and Health Administration) sets and enforces workplace safety standards.\n\nKey OSHA Standards for Construction (29 CFR 1926):\n\n1. Fall Protection (Subpart M)\n- Required at heights of 6 feet or more\n- Methods: guardrails, safety nets, personal fall arrest systems\n- Leading cause of death in construction\n\n2. Scaffolding (Subpart L)\n- Must support 4x intended load\n- Competent person must inspect daily\n- Guardrails required above 10 feet\n\n3. Excavations (Subpart P)\n- Trenches 5+ feet deep require protective systems\n- Competent person must inspect daily\n- Keep spoils at least 2 feet from edge\n\n4. Electrical (Subpart K)\n- GFCI protection required\n- Assured equipment grounding conductor program\n- Maintain safe distances from power lines\n\n5. PPE (Subpart E)\n- Hard hats, safety glasses, steel-toe boots\n- Employer must provide at no cost\n- Training on proper use required\n\nOSHA Penalties (2026):\n- Serious violation: up to $16,131\n- Willful violation: up to $161,323\n- Keep your sites safe and compliant!", sortOrder: 1 },
        { courseId: course3.id, title: "Hazard Identification and Prevention", content: "Identifying Hazards Before They Cause Harm\n\nThe Focus Four Hazards (cause 60%+ of construction deaths):\n1. Falls\n2. Struck-By\n3. Caught-In/Between\n4. Electrocution\n\nJob Hazard Analysis (JHA):\nBefore starting any task, conduct a JHA:\n1. Break the task into steps\n2. Identify potential hazards at each step\n3. Determine preventive measures\n4. Document and communicate to the crew\n\nDaily Safety Practices:\n- Toolbox talks (10-15 minute safety discussions)\n- Pre-task planning\n- Site inspections\n- Incident reporting (including near-misses)\n\nCreating a Safety Culture:\n- Lead by example\n- Empower workers to stop unsafe work\n- Recognize safe behavior\n- Investigate all incidents for root causes\n- Provide ongoing training\n\nRemember: Safety is not a cost — it's an investment. One serious injury can bankrupt a small contractor through workers' comp costs, OSHA fines, and project delays.", sortOrder: 2 },
      ]);
      console.log("Seeded 3 courses with lessons");
    }

    const topicCount = await db.select({ count: sql<number>`count(*)` }).from(discussionTopics);
    if (Number(topicCount[0]?.count || 0) === 0) {
      await db.insert(discussionTopics).values([
        { title: "Welcome to the NAMC NorCal Discussion Board!", category: "general", content: "Welcome everyone! This is our new community discussion space. Feel free to introduce yourself, share your company's work, and connect with fellow NAMC NorCal members.\n\nA few guidelines:\n- Be respectful and professional\n- Share knowledge and help each other\n- Post questions in the appropriate category\n- No spam or solicitation\n\nLooking forward to great conversations!", authorId: adminId, isPinned: true },
        { title: "Tips for Winning Public Works Bids", category: "business", content: "I wanted to start a thread where we can share tips for winning public works bids. Here are a few things that have worked for me:\n\n1. Read the entire bid package carefully — don't miss addenda\n2. Attend all pre-bid meetings and site walks\n3. Build relationships with prime contractors early\n4. Make sure your math is right — double check quantities\n5. Submit your bid early to avoid last-minute issues\n\nWhat tips would you add?", authorId: adminId },
        { title: "Best Practices for Managing Subcontractors", category: "business", content: "Managing subcontractors effectively is key to project success. Let's share our best practices.\n\nSome things I've found important:\n- Clear scope definitions in contracts\n- Regular communication and coordination meetings\n- Prompt payment (builds loyalty and good relationships)\n- Document everything\n- Address issues early before they become problems\n\nWhat's worked for you?", authorId: adminId },
        { title: "New OSHA Rules for 2026 — What You Need to Know", category: "technical", content: "OSHA has released several updated rules for 2026. Here are the key changes affecting construction:\n\n1. Updated heat illness prevention standards\n2. New silica dust exposure limits\n3. Revised fall protection equipment inspection requirements\n4. Updated crane operator certification rules\n\nMake sure your safety programs are updated. Feel free to ask questions about compliance here.", authorId: adminId },
        { title: "Upcoming Networking Events — Let's Connect!", category: "networking", content: "There are several great networking opportunities coming up this spring:\n\n- NAMC NorCal Monthly Meeting (March 15)\n- AGC NorCal Construction Expo (March 28-29)\n- Networking Mixer at Lake Merritt (April 5)\n- NAMC Annual Golf Tournament (May 10)\n\nWho's planning to attend? Let's coordinate and make the most of these events!", authorId: adminId },
      ]);
      console.log("Seeded 5 discussion topics");
    }

    const projectCount = await db.select({ count: sql<number>`count(*)` }).from(projectOpportunities);
    if (Number(projectCount[0]?.count || 0) === 0) {
      await db.insert(projectOpportunities).values([
        { title: "Oakland Unified School District — Roosevelt Middle School Renovation", description: "Seeking qualified subcontractors for the Roosevelt Middle School renovation project. Scope includes demolition, concrete, structural steel, plumbing, HVAC, electrical, painting, and flooring. DBE participation goal: 25%. Project duration: 14 months.\n\nKey Requirements:\n- Active CSLB license in relevant trade\n- Experience with K-12 school projects preferred\n- Prevailing wage project\n- Must provide performance and payment bonds\n\nPre-bid meeting: March 18, 2026 at 2:00 PM at the school site.", location: "Oakland, CA", budget: "$4.2M - $5.1M", deadline: "2026-04-01", contactEmail: "bids@namcnorcal.org", postedById: adminId, status: "open" },
        { title: "City of Berkeley — Streetscape Improvement Project", description: "The City of Berkeley is seeking bids for streetscape improvements along University Avenue from MLK Jr. Way to San Pablo Avenue. Scope includes:\n- Sidewalk replacement and ADA upgrades\n- Street lighting installation\n- Landscape and irrigation\n- Street furniture installation\n- Pavement milling and overlay\n\nMBE/WBE goal: 20%. This is a prevailing wage project funded by Measure T.", location: "Berkeley, CA", budget: "$2.8M - $3.5M", deadline: "2026-03-25", contactEmail: "bids@namcnorcal.org", postedById: adminId, status: "open" },
        { title: "BART — Platform Safety Improvements (Multiple Stations)", description: "BART is soliciting proposals for platform safety improvements at five East Bay stations. Work includes:\n- Tactile tile installation\n- Platform edge warning systems\n- Lighting upgrades\n- ADA signage and wayfinding\n- Emergency equipment installation\n\nDBE participation goal: 22%. Federal Transit Administration funded project.\n\nInterested firms must be registered in the BART vendor database.", location: "Various East Bay Stations", budget: "$1.5M - $2.2M", deadline: "2026-04-15", contactEmail: "bids@namcnorcal.org", postedById: adminId, status: "open" },
        { title: "Affordable Housing Development — East 14th Street", description: "General contractor seeking subcontractors for a 65-unit affordable housing development. Five-story wood-frame over concrete podium construction.\n\nTrades needed:\n- Concrete and foundations\n- Framing\n- Plumbing and fire sprinklers\n- Electrical\n- Drywall and painting\n- Flooring and tile\n- Cabinets and countertops\n- Roofing\n\nLocal hire requirements apply. DBE/MBE participation encouraged.", location: "San Leandro, CA", budget: "$18M - $22M", deadline: "2026-05-01", contactEmail: "bids@namcnorcal.org", postedById: adminId, status: "open" },
      ]);
      console.log("Seeded 4 project opportunities");
    }

    console.log("Sample content check complete");
  } catch (error) {
    console.error("Error seeding sample content:", error);
  }
}

export async function ensureTables() {
  try {
    console.log("Ensuring database tables exist...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id varchar NOT NULL,
        recipient_id varchar NOT NULL,
        subject text NOT NULL,
        content text NOT NULL,
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS discussion_topics (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        category text NOT NULL DEFAULT 'general',
        content text NOT NULL,
        author_id varchar NOT NULL,
        is_pinned boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS discussion_replies (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id varchar NOT NULL,
        author_id varchar NOT NULL,
        content text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_opportunities (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text NOT NULL,
        location text NOT NULL,
        budget text,
        deadline text,
        contact_email text,
        posted_by_id varchar NOT NULL,
        status text NOT NULL DEFAULT 'open',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_bids (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id varchar NOT NULL,
        bidder_id varchar NOT NULL,
        amount text NOT NULL,
        proposal text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        event_date text NOT NULL,
        event_time text,
        location text,
        created_by_id varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS newsletters (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        content text NOT NULL,
        published_at timestamp NOT NULL DEFAULT now(),
        created_by_id varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tools (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        category text NOT NULL DEFAULT 'general',
        owner_id varchar NOT NULL,
        status text NOT NULL DEFAULT 'available',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tool_loans (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tool_id varchar NOT NULL,
        borrower_id varchar NOT NULL,
        borrow_date timestamp NOT NULL DEFAULT now(),
        return_date timestamp,
        status text NOT NULL DEFAULT 'active',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS courses (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        created_by_id varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lessons (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id varchar NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id varchar NOT NULL,
        user_id varchar NOT NULL,
        progress integer NOT NULL DEFAULT 0,
        completed_lessons text NOT NULL DEFAULT '',
        enrolled_at timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("All tables ensured successfully");
  } catch (error) {
    console.error("Error ensuring tables:", error);
  }
}
