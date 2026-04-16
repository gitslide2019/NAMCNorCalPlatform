import { drizzle } from "drizzle-orm/node-postgres";
import { sql, eq } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";
import { users, membershipApplications, calendarEvents, newsletters, tools, courses, lessons, discussionTopics, projectOpportunities, campaigns, campaignPledges, budgetCategories, fundingSources } from "@shared/schema";
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
    const adminAccounts = [
      { username: "testadmin", password: "test1234" },
      { username: "shannon.hickman", password: "5108308294" },
    ];

    for (const admin of adminAccounts) {
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(admin.password, salt, 64)) as Buffer;
      const hashedPassword = buf.toString("hex") + "." + salt;

      const [existing] = await db.select().from(users).where(eq(users.username, admin.username));
      if (existing) {
        await db.update(users).set({ password: hashedPassword, isAdmin: true }).where(eq(users.id, existing.id));
        console.log(`Updated password for admin: ${admin.username}`);
        continue;
      }

      let memberAppId: string | undefined;
      if (admin.username === "shannon.hickman") {
        const [app] = await db.select().from(membershipApplications).where(eq(membershipApplications.companyName, "NAMC NorCal"));
        if (!app) {
          await db.insert(membershipApplications).values({
            contactName: "Shannon Hickman",
            companyName: "NAMC NorCal",
            title: "Executive Director",
            email: "info@namcnorcal.org",
            phone: "5108308294",
            address: "977 66th Ave",
            city: "Oakland",
            state: "CA",
            zipCode: "94621",
            businessType: "Other",
            yearsInBusiness: "20+",
            membershipType: "corporate_partner",
            membershipCategory: "general_contractor",
            status: "approved",
            acceptedTerms: true,
          } as any);
          const [newApp] = await db.select().from(membershipApplications).where(eq(membershipApplications.companyName, "NAMC NorCal"));
          memberAppId = newApp?.id;
        } else {
          memberAppId = app.id;
        }
      }

      await db.insert(users).values({
        username: admin.username,
        password: hashedPassword,
        isAdmin: true,
        memberApplicationId: memberAppId,
      });
      console.log(`Created admin user: ${admin.username}`);
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
      { username: "shannon.hickman", companyName: "NAMC NorCal", isBoardMember: false, isAdmin: true, password: "5108308294" },
      { username: "james.jackson", companyName: "Digital Disclosure AV", isBoardMember: false },
      { username: "tana.harris", companyName: "Harris Hoisting", isBoardMember: false },
      { username: "bruce.giron", companyName: "Giron Construction", isBoardMember: false },
      { username: "bianca.johnson", companyName: "Turner Construction", isBoardMember: false },
      { username: "kimberly.wilson", companyName: "Port of Oakland", isBoardMember: false },
      { username: "mario.wagner", companyName: "RF Contractors dba Royal Floors", isBoardMember: true, password: "NamcPresident2026!" },
      { username: "mark.hall", companyName: "Revalue.i o", isBoardMember: true },
      { username: "carl.gordon", companyName: "Gordon Plastering", isBoardMember: true },
      { username: "ronald.batiste", companyName: "Eagle Environmental Construction", isBoardMember: true },
      { username: "anoush.jackson", companyName: "Micah Jackson-Sattler dba - Micah Electric Co.", isBoardMember: true },
    ];

    for (const account of memberAccounts) {
      const [existing] = await db.select().from(users).where(eq(users.username, account.username));
      if (existing) {
        let updates: any = {};
        if (account.isBoardMember && !existing.isBoardMember) {
          updates.isBoardMember = true;
        }
        if ((account as any).isAdmin && !existing.isAdmin) {
          updates.isAdmin = true;
        }
        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, existing.id));
          console.log(`Updated ${account.username}: ${JSON.stringify(updates)}`);
        }
        continue;
      }

      const [app] = await db.select().from(membershipApplications).where(eq(membershipApplications.companyName, account.companyName));
      if (!app) {
        console.log(`Skipping ${account.username} - no application found for ${account.companyName}`);
        continue;
      }

      const pw = (account as any).password || "member123";
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(pw, salt, 64)) as Buffer;
      const hashedPassword = buf.toString("hex") + "." + salt;
      await db.insert(users).values({
        username: account.username,
        password: hashedPassword,
        isAdmin: (account as any).isAdmin || false,
        isBoardMember: account.isBoardMember,
        memberApplicationId: app.id,
      });
      console.log(`Created member account: ${account.username} (${account.companyName}${account.isBoardMember ? " - BOARD MEMBER" : ""})`);
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
        { name: "Laser Level (Bosch GLL3-330CG)", description: "360-degree green beam laser level with Bluetooth connectivity. Ideal for interior layout, framing, and tile work. Includes carrying case and batteries.", category: "measurement", ownerId: adminId, status: "available", condition: "good", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Rotary Hammer Drill (Hilti TE 7-C)", description: "SDS-plus rotary hammer drill for drilling and light chiseling in concrete, masonry, and natural stone. Includes depth gauge and carrying case.", category: "power-tools", ownerId: adminId, status: "available", condition: "good", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Concrete Moisture Meter", description: "Pin-type moisture meter for testing concrete slabs before flooring installation. Digital display with hold function. Essential for flooring contractors.", category: "measurement", ownerId: adminId, status: "available", condition: "good", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Pipe Threader Set (Ridgid 12-R)", description: "Manual ratchet pipe threader set with dies for 1/2\" to 2\" pipe. Heavy-duty construction. Perfect for plumbing contractors.", category: "hand-tools", ownerId: adminId, status: "available", condition: "fair", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Scaffolding Set (6ft Baker)", description: "Rolling baker scaffold, 6ft platform height. Includes guardrails, outriggers, and locking casters. 1000 lb capacity. Great for painting and drywall work.", category: "safety", ownerId: adminId, status: "available", condition: "good", location: "NAMC Warehouse — East Oakland" },
        { name: "Conduit Bender (Greenlee 1818)", description: "Mechanical conduit bender for 1/2\" to 1\" EMT. Includes handle and foot pedal. Durable aluminum construction.", category: "hand-tools", ownerId: adminId, status: "available", condition: "good", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Thermal Imaging Camera (FLIR C5)", description: "Compact thermal camera for detecting insulation gaps, moisture issues, and electrical hotspots. Wi-Fi enabled with cloud storage.", category: "measurement", ownerId: adminId, status: "available", condition: "good", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Demolition Hammer (Bosch 11335K)", description: "35 lb. demolition hammer for heavy-duty concrete and masonry removal. Includes carrying case and two chisels.", category: "power-tools", ownerId: adminId, status: "available", condition: "fair", location: "NAMC Warehouse — East Oakland" },
        { name: "Safety Harness Kit (3M Protecta)", description: "Full-body safety harness with 6-foot shock-absorbing lanyard. OSHA compliant. Adjustable fit up to 310 lbs.", category: "safety", ownerId: adminId, status: "available", condition: "good", location: "NAMC Office — 977 66th Ave, Oakland" },
        { name: "Table Saw (DeWalt DWE7491RS)", description: "10-inch job site table saw with rolling stand. 32-1/2\" rip capacity. Includes fence, miter gauge, and blade guard.", category: "power-tools", ownerId: adminId, status: "available", condition: "good", location: "NAMC Warehouse — East Oakland" },
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

    const REAL_PROJECTS = [
      { title: "SFPUC 18th Annual Contractors Breakfast 2026", description: "Event to share upcoming SFPUC projects and how companies can get involved.", location: "The War Memorial, Green Room, 401 Van Ness, San Francisco, CA 94102", deadline: "2026-05-15", contactEmail: "Registration link in email", postedById: adminId, status: "open", latitude: "37.7782", longitude: "-122.4197", category: "Networking", organization: "San Francisco Public Utilities Commission (SFPUC)", gmailLink: "https://mail.google.com/mail/#all/19d93bcd6739ef79", emailSentDate: "2026-04-15", notes: "Event date: 2026-05-15; Time: 7:30 AM-11:00 AM; Cost: FREE" },
      { title: "Transbay Block 4 West General Contractor RFP", description: "24-story, 314-unit, 100% affordable housing project for families. NAMC notes there may be JV opportunities with a prime contractor.", location: "Bounded by Beale, Howard, and Main streets, San Francisco", deadline: "2026-05-21", contactEmail: "Sean.Wils@mercyhousing.org; Stephanie.Ma@mercyhousing.org; rabbott@ycdjobs.org; jacksmith@ycdjobs.org", postedById: adminId, status: "open", latitude: "37.7918", longitude: "-122.3948", category: "RFP", organization: "Mercy Housing California and Young Community Developers / OCII", gmailLink: "https://mail.google.com/mail/#all/19d927a332326526", emailSentDate: "2026-04-15", notes: "Pre-submittal: 2026-04-23 9:00 AM; Questions due: 2026-04-24 2:00 PM; Q&A addendum: 2026-05-01 2:00 PM; Proposals due: 2026-05-21 2:00 PM; Shortlist: 2026-05-29; Interviews: late May/early June; Selection: mid-June" },
      { title: "UCSF Health Helen Diller Hospital (HDH) — BP74 Epoxy Flooring", description: "Bid package BP74 Epoxy Flooring. License classifications: C-15 Flooring and Floor Covering and C-61/D-12 Synthetic Products Contractor.", location: "UCSF Health, San Francisco, CA", contactEmail: "Rebecca.palm@ucsf.edu; registration via BuildingConnected", postedById: adminId, status: "open", latitude: "37.7631", longitude: "-122.4584", category: "Bid opportunity", organization: "UCSF Health", gmailLink: "https://mail.google.com/mail/#all/19d928776318cb48", emailSentDate: "2026-04-15", notes: "Prequalification documents available: 2026-04-14. No bid due date stated in email." },
      { title: "Webcor & NAMC NorCal Contractor Engagement Luncheon", description: "Opportunity to connect directly with Webcor's procurement, estimating, and project management teams and learn about upcoming project opportunities.", location: "207 King Street, #300, San Francisco, CA", deadline: "2026-04-28", contactEmail: "info@namcnorcal.org", postedById: adminId, status: "open", latitude: "37.7765", longitude: "-122.3933", category: "Networking", organization: "Webcor / NAMC NorCal", gmailLink: "https://mail.google.com/mail/#all/19d786bffed065e6", emailSentDate: "2026-04-10", notes: "Event date: Tuesday, April 28; Time: 11:00 AM-1:00 PM. RSVP: info@namcnorcal.org" },
      { title: "R410A Phase Out Seminar – Are You Ready Sacramento?", description: "Free one-day seminar for contractors on refrigerant transition, regulatory changes, refrigerant alternatives, safe handling, and Quality HVAC opportunities.", location: "Capital Event Center, 1120 11th Street, Sacramento, CA 95814", deadline: "2026-04-13", contactEmail: "https://R410APhaseOutSacramento.eventbrite.com", postedById: adminId, status: "closed", latitude: "38.5760", longitude: "-121.4936", category: "Training", organization: "Frontier Quality HVAC Program", gmailLink: "https://mail.google.com/mail/#all/19d69616d01844e0", emailSentDate: "2026-04-07", notes: "Closed: registration deadline passed. Event date was 2026-04-23." },
      { title: "A Conversation on Rule 9-6 and What It Means for Projects", description: "Discussion on Rule 9-6 timeline, project-level impacts, and proposed exemptions for smaller projects and low-income housing.", location: "300 Frank H. Ogawa Plaza, Oakland, CA 94612", deadline: "2026-04-07", contactEmail: "info@namcnorcal.org", postedById: adminId, status: "closed", latitude: "37.8047", longitude: "-122.2720", category: "Policy", organization: "Build It Green / Bay Area Air District", gmailLink: "https://mail.google.com/mail/#all/19d308ee5e961d4d", emailSentDate: "2026-03-27", notes: "Past event as of 2026-04-15. Event date: Tuesday, April 7, 2026; Time: 4:00 PM-6:00 PM" },
      { title: "Sacramento International Airport Concourse B Expansion — SBE Outreach Event", description: "Outreach event to learn more about upcoming project for the Sacramento International Airport Concourse B Expansion Terminal Improvements.", location: "Depot Park Conference Center, 8215 Ferguson Avenue, Sacramento, CA 95828", deadline: "2026-04-08", contactEmail: "mpenn@swinerton.com", postedById: adminId, status: "closed", latitude: "38.5168", longitude: "-121.4263", category: "Outreach", organization: "Austin Swinerton Joint Venture / Sacramento County Department of Airports", gmailLink: "https://mail.google.com/mail/#all/19d1ce0f67829c7d", emailSentDate: "2026-03-23", notes: "Past event as of 2026-04-15. Event date: April 8, 2026; Time: 1 PM-3 PM" },
      { title: "Call for Participants: Zero-Emission Equipment in Existing Non-Residential Buildings", description: "Paid opportunity for electricians, plumbers, contractors, inspectors, building engineers, property owners, and operators to share experience with zero-emission equipment projects in existing non-residential buildings.", location: "California (focus groups)", contactEmail: "Interest form and study website linked in email", postedById: adminId, status: "unknown", category: "Paid study participation", organization: "CARB / UCLA California Center for Sustainable Communities", gmailLink: "https://mail.google.com/mail/#all/19ce9f0c0eb28bbb", emailSentDate: "2026-03-13", notes: "Focus groups scheduled March-April 2026. Status unknown from email alone." },
      { title: "Doing Business with Sierra College Vendor Fair", description: "Vendor fair to learn procurement process, meet Facilities and Construction team, and hear about upcoming subcontractor CMAR procurement with Otto Construction for the Student Union Modernization Project.", location: "Sierra College Board Room (Rocklin Campus), 5100 Sierra College Blvd, Rocklin, CA 95677", deadline: "2026-03-24", contactEmail: "kmoulton@sierracollege.edu", postedById: adminId, status: "closed", latitude: "38.7907", longitude: "-121.2354", category: "Outreach", organization: "Sierra College", gmailLink: "https://mail.google.com/mail/#all/19cdeedeee63548d", emailSentDate: "2026-03-11", notes: "Past event as of 2026-04-15. Event date: March 24; Time: 3:00-5:00 PM" },
      { title: "Contra Costa East County Service Center", description: "New 3-story facility totaling approximately 120,000 GSF on 7.8 acres. Webcor seeking MBE, WBE, OBE, SBE, LBE, and DVBE trade partners for listed work packages.", location: "Brentwood, CA", deadline: "2026-04-06", contactEmail: "Karen Turcios; Alec Bangs (Smartsheet intent-to-bid link in email)", postedById: adminId, status: "closed", latitude: "37.9316", longitude: "-121.6969", category: "Bid opportunity", organization: "Webcor Builders / Contra Costa County", gmailLink: "https://mail.google.com/mail/#all/19cde559bd438b9e", emailSentDate: "2026-03-11", notes: "Past due as of 2026-04-15. Proposal due: 2026-04-06." },
      { title: "Marina Del Rey Boat Launch — BRC0000517", description: "Seeking qualified firms for street sweeping, electrical, clearing and grubbing, roadway excavation, striping, materials, trucking, landscaping and irrigation.", location: "Marina Del Rey, CA", deadline: "2026-03-19", contactEmail: "estimating@beador.com; denise@beador.com; (951) 674-7352", postedById: adminId, status: "closed", latitude: "33.9769", longitude: "-118.4530", category: "Bid opportunity", organization: "Los Angeles County Public Works / Beador Construction Company, Inc.", gmailLink: "https://mail.google.com/mail/#all/19cd4f13499c1af3", emailSentDate: "2026-03-09", notes: "Past due as of 2026-04-15. Bid date: 03/19/2026 at 02:00 PM" },
      { title: "McClymonds High School Modernization Project", description: "Bid walk session to learn more about project requirements and procurement opportunities. Bid via Building Connected.", location: "2607 Myrtle Street, Oakland, CA", deadline: "2026-03-11", contactEmail: "Zoom Meeting ID 813 0611 7540; Passcode 597961", postedById: adminId, status: "closed", latitude: "37.8291", longitude: "-122.2748", category: "Bid opportunity", organization: "Oakland Unified School District", gmailLink: "https://mail.google.com/mail/#all/19c723a874ce5a6e", emailSentDate: "2026-02-18", notes: "Past due as of 2026-04-15. Bid deadline: 2026-03-11 2pm via Building Connected." },
      { title: "NAMC-NorCal & Turner Construction Mixer", description: "Come meet the estimating and procurement team. Learn about what projects are in the pipeline.", location: "Turner Construction, Northern California", deadline: "2026-02-26", contactEmail: "info@namcnorcal.org", postedById: adminId, status: "closed", category: "Networking", organization: "Turner Construction / NAMC NorCal", gmailLink: "https://mail.google.com/mail/#all/19c6da9f43342027", emailSentDate: "2026-02-17", notes: "Past event as of 2026-04-15. Event date: 2026-02-26 4pm-6pm PST" },
      { title: "Small Rehab Project (ACAH Funding) — 539 Mandana Blvd", description: "7-unit property. Looking for contractors for unit legalization, physical upgrades, general rehab, plumbing and electrical repairs/upgrades, and solar integration.", location: "539 Mandana Blvd, Oakland, CA", deadline: "2026-03-08", contactEmail: "rahul.joshi@shcla.land; teslim.ikharo@shcla.land; (619) 897-7950", postedById: adminId, status: "closed", latitude: "37.8164", longitude: "-122.2395", category: "Bid opportunity", organization: "Supportive Housing Community Land Alliance (SHCLA)", gmailLink: "https://mail.google.com/mail/#all/19c54d675e121f57", emailSentDate: "2026-02-12", notes: "Opportunity likely no longer current. Physical access to property ended 2026-03-08." },
      { title: "5th Annual Caltrans DBE-SB Summit — Exhibitor Invitation", description: "Invitation to exhibit at the DBE-SB Summit connecting small businesses with state transportation procurement.", location: "Fresno Convention Center, Fresno, CA", deadline: "2026-03-04", contactEmail: "Dalia.Demian@dot.ca.gov; exhibitor registration link in email", postedById: adminId, status: "closed", latitude: "36.7298", longitude: "-119.7838", category: "Outreach", organization: "Caltrans Office of Civil Rights", gmailLink: "https://mail.google.com/mail/#all/19c4f0dd916faa61", emailSentDate: "2026-02-11", notes: "Past event as of 2026-04-15. Event date: 2026-03-04; Time: 9:00 AM-3:00 PM" },
      { title: "MB RCC Digital Signage Upgrade (PRJ-000576)", description: "Architectural services to update existing digital signage, including wayfinding and room signage at Rutter Community Center.", location: "Rutter Community Center, San Francisco, CA", contactEmail: "joshua.robson@ucsf.edu; taufique.gagan@ucsf.edu; BuildingConnected link in email", postedById: adminId, status: "closed", category: "Bid opportunity", organization: "UCSF Real Estate", gmailLink: "https://mail.google.com/mail/#all/19c20dded0d7e441", emailSentDate: "2026-02-02", notes: "Forwarded in 2026 but deadline stated in email was June 4, 2025. Treated as closed." },
      { title: "5th Annual Caltrans DBE-SB Summit", description: "Chance to engage with state and local government buyers and learn about contracting opportunities and resources.", location: "Fresno Convention Center, Fresno, CA", deadline: "2026-03-04", contactEmail: "smallbusinessadvocate@dot.ca.gov; Registration link in email", postedById: adminId, status: "closed", latitude: "36.7298", longitude: "-119.7838", category: "Outreach", organization: "Caltrans", gmailLink: "https://mail.google.com/mail/#all/19c00eecc9564b8b", emailSentDate: "2026-01-27", notes: "Past event as of 2026-04-15. Wednesday, March 4, 2026; 9:00 am-3:00 pm" },
      { title: "Turner School of Construction Management Program Spring 2026", description: "Free in-person 6-week program for underrepresented business contractors covering project management, finance, business development, project planning, and estimating.", location: "Turner Construction office, Walnut Creek, CA", deadline: "2026-02-13", contactEmail: "www.CaliforniaTSCM.com; bfjohnson@tcco.com; digonzalez@tcco.com", postedById: adminId, status: "closed", latitude: "37.9101", longitude: "-122.0652", category: "Training", organization: "Turner Construction", gmailLink: "https://mail.google.com/mail/#all/19bbeba6c0f60556", emailSentDate: "2026-01-14", notes: "Past program as of 2026-04-15. Program dates: 2026-03-03 to 2026-04-09; Applications closed: February 13." },
      { title: "Learn About BART's Small Business Enterprise (SBE) Certification", description: "Learn about upcoming BART contracting opportunities, SBE certification requirements, and how to apply and use the certification portal.", location: "Zoom (virtual)", deadline: "2025-12-10", contactEmail: "ocrcertifications@bart.gov; alexandra.arroyo@bart.gov", postedById: adminId, status: "closed", category: "Training", organization: "BART", gmailLink: "https://mail.google.com/mail/#all/19ae15990fb7fd84", emailSentDate: "2025-12-02", notes: "Past event as of 2026-04-15. Wednesday, December 10, 2025; 2:00 PM-3:00 PM" },
      { title: "Equitable Building Decarbonization – Northern California Program Installation Contractor RFQ Coming Soon", description: "Notice that installation contractor RFQ will be released soon. Looking for contractors with at least 3 years of experience in residential retrofit work.", location: "Northern California", contactEmail: "No direct contact clearly stated in the usable portion", postedById: adminId, status: "closed", category: "RFQ notice", organization: "Equitable Building Decarbonization – Northern California Program", gmailLink: "https://mail.google.com/mail/#all/19a838f53156f2c6", emailSentDate: "2025-11-14", notes: "Advance notice only; no live RFQ details in the email body. No release date stated." },
      { title: "Port of Oakland — Emergency Spill Response or Emergency Repairs", description: "Solicitation notice for emergency spill response or emergency repairs in a hazardous environment at Port of Oakland facilities.", location: "Oakland, California", contactEmail: "Port of Oakland bids/RFP center link in email", postedById: adminId, status: "unknown", latitude: "37.8044", longitude: "-122.2712", category: "Bid opportunity", organization: "Port of Oakland", gmailLink: "https://mail.google.com/mail/#all/199a19165dc4f87a", emailSentDate: "2025-10-01", notes: "Contract period: commencing 2026-04-01. Status unknown from email alone." },
      { title: "Port of Oakland — Removal and Disposal of Hazardous Waste and Contaminated Materials", description: "RFP notice for removal and disposal of hazardous waste, universal waste, and other contaminated materials.", location: "Oakland, California", contactEmail: "Port of Oakland bids/RFP center link in email", postedById: adminId, status: "unknown", latitude: "37.8044", longitude: "-122.2712", category: "Bid opportunity", organization: "Port of Oakland", gmailLink: "https://mail.google.com/mail/#all/199a18d8203f092d", emailSentDate: "2025-10-01", notes: "Contract period: commencing 2026-04-01. Status unknown from email alone." },
      { title: "C2496256 FIN — MB CVRB Cold Room Remediation", description: "General Building (B) license required. Bidding documents available on 2025-09-30.", location: "UCSF, San Francisco, CA", contactEmail: "Darrick.Lo@ucsf.edu; Karen.Wong@ucsf.edu; BuildingConnected link in email", postedById: adminId, status: "unknown", latitude: "37.7631", longitude: "-122.4584", category: "Bid opportunity", organization: "UCSF Real Estate", gmailLink: "https://mail.google.com/mail/#all/199a18c1a71e81ce", emailSentDate: "2025-10-01", notes: "Bidding documents available: 2025-09-30; no bid due date stated." },
      { title: "City of Oakland MPSLB Program — On-Call General Construction Services RFQ", description: "Open to SLBEs and VSLBEs only. List used for construction work valued at $250,000 or less. Pool of pre-qualified contractors for task-order work.", location: "Oakland, CA", deadline: "2025-10-16", contactEmail: "capitalcontracts@oaklandca.gov; certification@oaklandca.gov", postedById: adminId, status: "closed", latitude: "37.8047", longitude: "-122.2720", category: "RFQ", organization: "City of Oakland", gmailLink: "https://mail.google.com/mail/#all/19954747670f6118", emailSentDate: "2025-09-16", notes: "Past due as of 2026-04-15. Applications open 2025-09-16 to 2025-10-16." },
      { title: "SFO T3W Outreach Event", description: "Outreach event related to SFO Terminal 3 West project. See email for attached invitation with full details.", location: "San Francisco International Airport", contactEmail: "See invitation attachment", postedById: adminId, status: "unknown", latitude: "37.6213", longitude: "-122.3790", category: "Outreach", organization: "SFO / T3W Project Team", gmailLink: "https://mail.google.com/mail/#all/19953a0cc4557ce4", emailSentDate: "2025-09-16", notes: "Details not stated in the email body; invitation was an attachment." },
      { title: "SFPUC 18th Annual Contractors Breakfast 2026 — Save the Date", description: "Save-the-date notice for contractors breakfast about upcoming SFPUC projects. Registration opening soon.", location: "The War Memorial, Green Room, San Francisco, CA", deadline: "2026-05-15", contactEmail: "Registration coming soon (see later email)", postedById: adminId, status: "closed", latitude: "37.7782", longitude: "-122.4197", category: "Networking", organization: "San Francisco Public Utilities Commission (SFPUC)", gmailLink: "https://mail.google.com/mail/#all/19cde6d0ccf3b75b", emailSentDate: "2026-03-11", notes: "Superseded: A later registration-open email (April 15) replaced this save-the-date. Event date: 2026-05-15; Time: 7:30-10:00 AM." },
    ];

    await db.execute(sql`
      DELETE FROM project_opportunities WHERE gmail_link IS NULL AND organization IS NULL
    `);
    await db.execute(sql`
      UPDATE project_opportunities SET status = 'unknown'
      WHERE status = 'closed' AND gmail_link IN (
        'https://mail.google.com/mail/#all/19ce9f0c0eb28bbb',
        'https://mail.google.com/mail/#all/199a19165dc4f87a',
        'https://mail.google.com/mail/#all/199a18d8203f092d',
        'https://mail.google.com/mail/#all/199a18c1a71e81ce',
        'https://mail.google.com/mail/#all/19953a0cc4557ce4'
      )
    `);
    const existingGmailLinks = await db.execute(sql`SELECT gmail_link FROM project_opportunities WHERE gmail_link IS NOT NULL`);
    const existingLinks = new Set((existingGmailLinks.rows as { gmail_link: string }[]).map(r => r.gmail_link));
    const missingProjects = REAL_PROJECTS.filter(p => p.gmailLink && !existingLinks.has(p.gmailLink));
    if (missingProjects.length > 0) {
      await db.insert(projectOpportunities).values(missingProjects);
      console.log(`Inserted ${missingProjects.length} missing real project opportunities`);
    }
    const finalCount = await db.select({ count: sql<number>`count(*)` }).from(projectOpportunities);
    const expectedTotal = REAL_PROJECTS.length;
    const actualTotal = Number(finalCount[0]?.count || 0);
    if (actualTotal < expectedTotal) {
      console.warn(`Project opportunities: expected at least ${expectedTotal}, found ${actualTotal}. Some feed entries may be missing.`);
    } else {
      console.log(`Project opportunities: ${actualTotal} total (${expectedTotal} from NAMC feed)`);
    }

    const campaignCount = await db.select({ count: sql<number>`count(*)` }).from(campaigns);
    if (Number(campaignCount[0]?.count || 0) === 0) {
      const memberUsers = await db.select().from(users).where(sql`${users.isAdmin} = false`);
      const memberIds = memberUsers.map(u => u.id);

      const [camp1] = await db.insert(campaigns).values({
        title: "NAMC NorCal Workforce Development Fund 2026",
        description: "Support our initiative to train the next generation of minority contractors in Northern California. Funds will provide scholarships for trade apprenticeship programs, cover costs for OSHA and safety certifications, and sponsor hands-on construction management workshops. Our goal is to place 50 new skilled workers into the construction pipeline this year.\n\nYour contributions directly support:\n- Trade apprenticeship tuition assistance\n- OSHA 10/30-Hour certification courses\n- Construction estimating and project management workshops\n- Mentorship pairing with experienced NAMC contractors\n- Job placement assistance and resume support",
        goalAmount: "50000.00",
        currentAmount: "0",
        startDate: "2026-01-15",
        endDate: "2026-12-31",
        status: "active",
        createdById: adminId,
      }).returning();

      const [camp2] = await db.insert(campaigns).values({
        title: "East Oakland Community Center Renovation",
        description: "NAMC NorCal members are coming together to renovate the East Oakland Youth Development Center. This project will demonstrate our collective capabilities while giving back to the community that supports us.\n\nProject scope includes:\n- Interior demolition and hazmat abatement\n- New HVAC system installation\n- Electrical upgrades to meet current code\n- ADA-compliant restroom renovation\n- Exterior painting and landscaping\n- New basketball court resurfacing\n\nAll labor will be donated by NAMC member companies. Funds raised cover materials, permits, and equipment rental.",
        goalAmount: "25000.00",
        currentAmount: "0",
        startDate: "2026-02-01",
        endDate: "2026-08-31",
        status: "active",
        createdById: adminId,
      }).returning();

      const [camp3] = await db.insert(campaigns).values({
        title: "Annual Trade School Scholarship Fund",
        description: "Every year, NAMC NorCal awards scholarships to students pursuing careers in the construction trades. These scholarships cover tuition, books, tools, and living expenses for students enrolled in accredited trade programs across Northern California.\n\n2026 Partner Schools:\n- Laney College — Construction Management Technology\n- Carpenters Training Committee for Northern California\n- IBEW Local 595 Electrical Apprenticeship\n- Plumbers & Steamfitters Local 342\n- Operating Engineers Local 3 Training Center\n\nPast recipients have gone on to become licensed contractors, project managers, and NAMC members themselves. This is how we build the next generation.",
        goalAmount: "15000.00",
        currentAmount: "0",
        startDate: "2026-01-01",
        endDate: "2026-06-30",
        status: "active",
        createdById: adminId,
      }).returning();

      if (memberIds.length >= 5) {
        const pledges = [
          { campaignId: camp1.id, userId: memberIds[0], amount: "5000.00", note: "Happy to support workforce development — this is how we grow our industry.", status: "received", paidAt: new Date("2026-02-01") },
          { campaignId: camp1.id, userId: memberIds[1], amount: "2500.00", note: "Training the next generation is critical. Count us in.", status: "received", paidAt: new Date("2026-02-10") },
          { campaignId: camp1.id, userId: memberIds[2], amount: "7500.00", note: "Our company benefited from mentorship programs — paying it forward.", status: "received", paidAt: new Date("2026-02-15") },
          { campaignId: camp1.id, userId: memberIds[3], amount: "3000.00", note: "Looking forward to seeing more skilled workers in the pipeline.", status: "pledged", paidAt: null },
          { campaignId: camp1.id, userId: memberIds[4], amount: "10000.00", note: "Major pledge for Q2. Will remit by end of April.", status: "pledged", paidAt: null },
          { campaignId: camp1.id, userId: adminId, amount: "2000.00", note: "NAMC admin contribution.", status: "received", paidAt: new Date("2026-01-20") },

          { campaignId: camp2.id, userId: memberIds[0], amount: "1500.00", note: "Great cause — our crew can also donate time on weekends.", status: "received", paidAt: new Date("2026-02-20") },
          { campaignId: camp2.id, userId: memberIds[2], amount: "2000.00", note: "We'll cover materials for the HVAC portion.", status: "pledged", paidAt: null },
          { campaignId: camp2.id, userId: memberIds[3], amount: "1000.00", note: "Glad to support community projects.", status: "received", paidAt: new Date("2026-02-25") },
          { campaignId: camp2.id, userId: memberIds[4], amount: "3000.00", note: "We have connections with a paint supplier — can get materials at cost.", status: "pledged", paidAt: null },

          { campaignId: camp3.id, userId: memberIds[0], amount: "2000.00", note: "Education changes lives. We sponsor a student every year.", status: "received", paidAt: new Date("2026-01-15") },
          { campaignId: camp3.id, userId: memberIds[1], amount: "3000.00", note: "Our company started because of a scholarship. Full circle.", status: "received", paidAt: new Date("2026-01-25") },
          { campaignId: camp3.id, userId: memberIds[2], amount: "2500.00", note: "Supporting Laney College students specifically.", status: "received", paidAt: new Date("2026-02-05") },
          { campaignId: camp3.id, userId: memberIds[3], amount: "1500.00", note: "Trade schools need more investment.", status: "received", paidAt: new Date("2026-02-12") },
          { campaignId: camp3.id, userId: memberIds[4], amount: "3000.00", note: "Matching our Q1 pledge. Will pay by March.", status: "pledged", paidAt: null },
        ];

        for (const pledge of pledges) {
          await db.insert(campaignPledges).values(pledge);
        }

        const camp1Received = 5000 + 2500 + 7500 + 2000;
        const camp2Received = 1500 + 1000;
        const camp3Received = 2000 + 3000 + 2500 + 1500;

        await db.update(campaigns).set({ currentAmount: camp1Received.toFixed(2) }).where(eq(campaigns.id, camp1.id));
        await db.update(campaigns).set({ currentAmount: camp2Received.toFixed(2) }).where(eq(campaigns.id, camp2.id));
        await db.update(campaigns).set({ currentAmount: camp3Received.toFixed(2) }).where(eq(campaigns.id, camp3.id));
      }

      console.log("Seeded 3 campaigns with pledges");
    }

    const budgetCount = await db.select({ count: sql<number>`count(*)` }).from(budgetCategories);
    if (Number(budgetCount[0]?.count || 0) === 0) {
      await db.insert(budgetCategories).values([
        { name: "Staff Salaries", type: "expense", budgetedAmount: "180000.00", actualAmount: "135000.00", fiscalYear: "2025-2026", notes: "Executive Director, Program Manager, Administrative Assistant, part-time Outreach Coordinator" },
        { name: "Office Rent & Utilities", type: "expense", budgetedAmount: "36000.00", actualAmount: "27000.00", fiscalYear: "2025-2026", notes: "977 66th Ave, Oakland — lease through June 2027, includes parking" },
        { name: "Insurance & Bonding", type: "expense", budgetedAmount: "18000.00", actualAmount: "18000.00", fiscalYear: "2025-2026", notes: "General liability, D&O, workers comp — paid annually in July" },
        { name: "Program Operations", type: "expense", budgetedAmount: "45000.00", actualAmount: "28500.00", fiscalYear: "2025-2026", notes: "Workforce development programs, certification prep workshops, mentorship coordination" },
        { name: "Marketing & Outreach", type: "expense", budgetedAmount: "24000.00", actualAmount: "16200.00", fiscalYear: "2025-2026", notes: "Website maintenance, social media, print materials, membership drives" },
        { name: "Events & Networking", type: "expense", budgetedAmount: "30000.00", actualAmount: "14500.00", fiscalYear: "2025-2026", notes: "Monthly meetings, annual golf tournament, mixers, awards gala" },
        { name: "Professional Development", type: "expense", budgetedAmount: "15000.00", actualAmount: "8200.00", fiscalYear: "2025-2026", notes: "Staff training, conference attendance, NAMC National convention travel" },
        { name: "Technology & IT", type: "expense", budgetedAmount: "12000.00", actualAmount: "9800.00", fiscalYear: "2025-2026", notes: "Member portal hosting, email services, CRM software, Zoom subscriptions" },
        { name: "Legal & Accounting", type: "expense", budgetedAmount: "15000.00", actualAmount: "7500.00", fiscalYear: "2025-2026", notes: "Annual audit, tax preparation, contract review, legal counsel retainer" },
        { name: "Miscellaneous & Contingency", type: "expense", budgetedAmount: "10000.00", actualAmount: "3800.00", fiscalYear: "2025-2026", notes: "Office supplies, travel reimbursements, emergency fund, miscellaneous" },
      ]);
      console.log("Seeded 10 budget categories");
    }

    const fundingCount = await db.select({ count: sql<number>`count(*)` }).from(fundingSources);
    if (Number(fundingCount[0]?.count || 0) === 0) {
      await db.insert(fundingSources).values([
        { name: "Member Dues", type: "revenue", projectedAmount: "150000.00", receivedAmount: "112500.00", fiscalYear: "2025-2026", notes: "60 active members across Small ($500), Medium ($1,500), Large ($3,000), and Government ($2,500) tiers" },
        { name: "Corporate Sponsors", type: "revenue", projectedAmount: "120000.00", receivedAmount: "85000.00", fiscalYear: "2025-2026", notes: "Turner Construction, PG&E, Kaiser Permanente, Webcor Builders, Clark Construction — annual sponsorship agreements" },
        { name: "Government Grants", type: "revenue", projectedAmount: "75000.00", receivedAmount: "50000.00", fiscalYear: "2025-2026", notes: "City of Oakland Small Business Grant, CA Workforce Development Board, SBA Community Navigator grant" },
        { name: "Fundraising Campaigns", type: "revenue", projectedAmount: "40000.00", receivedAmount: "28500.00", fiscalYear: "2025-2026", notes: "Workforce Development Fund, Community Center Renovation, Scholarship Fund — see Campaigns section" },
        { name: "Event Revenue", type: "revenue", projectedAmount: "25000.00", receivedAmount: "18000.00", fiscalYear: "2025-2026", notes: "Golf tournament sponsorships, gala ticket sales, workshop registration fees" },
        { name: "Individual Donations", type: "revenue", projectedAmount: "10000.00", receivedAmount: "6500.00", fiscalYear: "2025-2026", notes: "Board member contributions, alumni giving, community supporters" },
      ]);
      console.log("Seeded 6 funding sources");
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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_board_member boolean NOT NULL DEFAULT false
    `);
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
        latitude text,
        longitude text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS latitude text
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS longitude text
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS category text
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS organization text
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS gmail_link text
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS email_sent_date text
    `);
    await db.execute(sql`
      ALTER TABLE project_opportunities ADD COLUMN IF NOT EXISTS notes text
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
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budget_categories (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        type text NOT NULL DEFAULT 'expense',
        budgeted_amount numeric(12,2) NOT NULL,
        actual_amount numeric(12,2) NOT NULL DEFAULT 0,
        fiscal_year text NOT NULL,
        notes text,
        created_at timestamp DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS funding_sources (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        type text NOT NULL DEFAULT 'revenue',
        projected_amount numeric(12,2) NOT NULL,
        received_amount numeric(12,2) NOT NULL DEFAULT 0,
        fiscal_year text NOT NULL,
        notes text,
        created_at timestamp DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS member_projects (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        location text,
        project_value text,
        completion_date text,
        client_name text,
        role text,
        image_data text,
        image_type text,
        is_featured boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS member_documents (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        title text NOT NULL,
        description text,
        file_name text NOT NULL,
        file_size integer,
        file_type text,
        file_data text NOT NULL,
        category text NOT NULL DEFAULT 'general',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      ALTER TABLE tools ADD COLUMN IF NOT EXISTS lending_terms text
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tool_borrow_requests (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tool_id varchar NOT NULL,
        requester_id varchar NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        message text,
        owner_response text,
        requested_start_date timestamp,
        requested_return_date timestamp,
        responded_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      ALTER TABLE tool_loans ADD COLUMN IF NOT EXISTS request_id varchar
    `);
    await db.execute(sql`
      ALTER TABLE tool_loans ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sms_invitations (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        phone text NOT NULL,
        company_name text,
        email text,
        message text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        twilio_sid text,
        sent_at timestamp,
        sent_by_id varchar NOT NULL,
        batch_id varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      ALTER TABLE sms_invitations ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sms'
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sms_contacts (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name text NOT NULL,
        contact_name text,
        phone text NOT NULL,
        email text,
        address text,
        city text,
        county text,
        state text,
        zip_code text,
        business_type text,
        classifications text,
        license_number text,
        website text,
        minority_owned text,
        status text NOT NULL DEFAULT 'active',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    const intelligenceColumns = [
      "google_search_url", "specialties", "outreach_description", "project_focus",
      "energy_relevance", "why_namc_relevant", "membership_value", "membership_pitch",
      "best_outreach_angle", "sms_template", "email_template", "preferred_contact_name",
      "professional_salutation", "primary_license_types"
    ];
    for (const col of intelligenceColumns) {
      await db.execute(sql.raw(`ALTER TABLE sms_contacts ADD COLUMN IF NOT EXISTS ${col} text`));
    }

    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS saved_project_opportunities (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        project_id varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id, project_id)
      )
    `);

    console.log("All tables ensured successfully");
  } catch (error) {
    console.error("Error ensuring tables:", error);
  }
}
