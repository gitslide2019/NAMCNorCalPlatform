import { db } from "../server/db";
import { membershipApplications } from "../shared/schema";
import { ilike, eq } from "drizzle-orm";

interface MemberRecord {
  email: string;
  companyName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  primaryServices: string;
  certifications: string;
  membershipTier: string;
  dateJoined: string;
  renewalDate: string;
}

const csvData: MemberRecord[] = [
  // === REGULAR MEMBERS ===
  { email: "jamesj@digitaldisclosureav.com", companyName: "Digital Disclosure AV", phone: "628-256-1828", address: "2766 Bush Street", city: "San Francisco", state: "CA", zipCode: "94115", county: "San Francisco", primaryServices: "C-7", certifications: "SBE, SBE (Micro), MBE, LBE", membershipTier: "Bronze/Standard", dateJoined: "9/1/2024", renewalDate: "9/1/2025" },
  { email: "baasimkhufu@gmail.com", companyName: "Onyx Insulation", phone: "628-227-4747", address: "", city: "Oakland", state: "CA", zipCode: "", county: "Alameda", primaryServices: "C-2", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "", renewalDate: "" },
  { email: "tana@harrishoisting.com", companyName: "Harris Hoisting", phone: "415-913-0143", address: "1320 Underwood Street", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "C-61, D-21", certifications: "SDVOSB, MBE, WBE, LBE, SB, SB-PW, DBE, DVBE", membershipTier: "Silver/VIP", dateJoined: "11/1/2024", renewalDate: "11/1/2025" },
  { email: "rbatiste@eec-corp.com", companyName: "Eagle Environmental Construction", phone: "925-413-0188", address: "2775 Butter Dr", city: "Oakland", state: "CA", zipCode: "94602", county: "Alameda", primaryServices: "A-GE, B-GC, HAZ, ASB, RAD", certifications: "LBE, DBE, MBE", membershipTier: "Bronze/Standard", dateJoined: "5/1/2025", renewalDate: "5/1/2026" },
  { email: "mansfieldmansfield380@yahoo.com", companyName: "Mansfield & Mansfield Construction Clean-Up", phone: "415-424-5774", address: "1659 Oakdale Ave", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "C-61, D63", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "10/1/2024", renewalDate: "10/1/2025" },
  { email: "mwagner@rfcontractors.com", companyName: "RF Contractors dba Royal Floors", phone: "510-228-2994", address: "8055 Collins Drive", city: "Oakland", state: "CA", zipCode: "94621", county: "Alameda", primaryServices: "C-15, B-GC", certifications: "SBE, MBE, VSLBE, SBA", membershipTier: "Silver/VIP", dateJoined: "1/1/2025", renewalDate: "1/1/2026" },
  { email: "bagiron@gironcms.com", companyName: "Giron Construction", phone: "510-229-3918", address: "1485 Bayshore Blvd, Suite 222", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "A-GE, B-GC, C-8, C-61/D49", certifications: "LBE, DBE, MBE, SBE, DVBE", membershipTier: "Gold/Major Corp", dateJoined: "1/1/2026", renewalDate: "" },
  { email: "reva@revamurphyassociates.com", companyName: "Reva Murphy Associates, Inc.", phone: "925-570-9940", address: "1485 Bayshore Blvd, Suite 150", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "B-GC, C-39", certifications: "LBE, WBE, DBE", membershipTier: "Silver/VIP", dateJoined: "", renewalDate: "" },
  { email: "presidiobuilders@live.com", companyName: "Presidio Builders", phone: "415-508-9727", address: "1485 Bayshore Blvd", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "B-GC", certifications: "", membershipTier: "Silver/VIP", dateJoined: "10/1/2024", renewalDate: "10/1/2025" },
  { email: "mark@revalue.io", companyName: "Revalue.io", phone: "510-387-0416", address: "827 Broadway, Suite 219", city: "Oakland", state: "CA", zipCode: "94607", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "5/1/2025", renewalDate: "5/1/2026" },
  { email: "alowe@lowecg.com", companyName: "Lowe Consulting Group, Inc.", phone: "510-986-1100", address: "520 3rd Street", city: "Oakland", state: "CA", zipCode: "94607", county: "Alameda", primaryServices: "", certifications: "DBE, LBE, SLEB, VSLBE, SBE", membershipTier: "Bronze/Standard", dateJoined: "2/1/2025", renewalDate: "2/1/2026" },
  { email: "bernida@comcast.net", companyName: "Consultant", phone: "510-301-7085", address: "", city: "", state: "CA", zipCode: "", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "9/1/2024", renewalDate: "9/1/2025" },
  { email: "curbsidetrucking@gmail.com", companyName: "Curbside Trucking LLC.", phone: "510-993-9363", address: "1300 Clay Street, Suite 600", city: "Oakland", state: "CA", zipCode: "94612", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "9/1/2024", renewalDate: "9/1/2025" },
  { email: "gordonplastering@gmail.com", companyName: "Gordon Plastering", phone: "415-937-3722", address: "8055 Collins Drive, Suite 207", city: "Oakland", state: "CA", zipCode: "94621", county: "Alameda", primaryServices: "C-35, C-61/D-63", certifications: "LBE, DBE", membershipTier: "Bronze/Standard", dateJoined: "12/1/2024", renewalDate: "12/1/2025" },
  { email: "eramsey@mtaltd.com", companyName: "Mason Tillman Associates", phone: "510-835-9012", address: "1999 Harrison Street, Suite 1800", city: "Oakland", state: "CA", zipCode: "94612", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "2/1/2025", renewalDate: "2/1/2026" },
  { email: "charlesa@bigpipemech.com", companyName: "Big Pipe Mechanical", phone: "415-466-6427", address: "1485 Bayshore Blvd, Suite 376", city: "San Francisco", state: "CA", zipCode: "94125", county: "San Francisco", primaryServices: "C-36, C-20", certifications: "DBE, MBE, DIR PW-LR, LBE, DGS SB (Micro), SB (PW)", membershipTier: "Silver/VIP", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "britepainting22@aol.com", companyName: "Brite Painting", phone: "510-703-1460", address: "739 Warfield Ave", city: "Oakland", state: "CA", zipCode: "94610", county: "Alameda", primaryServices: "C-33", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "9/1/2024", renewalDate: "9/1/2025" },
  { email: "dondones47@yahoo.com", companyName: "Dones Consulting Service", phone: "510-827-9686", address: "", city: "Oakland", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "Grandfathered", renewalDate: "" },
  { email: "jakesloan@aol.com", companyName: "Davillier-Sloan", phone: "510-385-1242", address: "1632 12th Street", city: "Oakland", state: "CA", zipCode: "94607", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "12/1/2024", renewalDate: "12/1/2025" },
  { email: "lightframeconstruction@gmail.com", companyName: "Light-Frame Construction, Inc.", phone: "510-715-0025", address: "22 Moss Ave, Unit 108", city: "Oakland", state: "CA", zipCode: "94610", county: "Alameda", primaryServices: "B-GC", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "2/1/2025", renewalDate: "2/1/2026" },
  { email: "bgriffin@tonma.us", companyName: "Tonma LLC", phone: "510-395-6143", address: "8055 Collins Drive, Suite 207", city: "Oakland", state: "CA", zipCode: "94621", county: "Alameda", primaryServices: "", certifications: "SBE, VSLBE, SLEB, DBE", membershipTier: "Bronze/Standard", dateJoined: "10/1/2024", renewalDate: "10/1/2025" },
  { email: "joseph.montiel@baytechelectric.com", companyName: "Bay-Tech Electric Inc", phone: "415-716-2307", address: "1485 Bayshore Blvd", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "C-10", certifications: "LBE, MBE, DIR-PW, SB-PW, SB (Micro)", membershipTier: "Silver/VIP", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "mathewsgec@gmail.com", companyName: "Mathews Engineering", phone: "209-879-1623", address: "1112 N. Main Street #105", city: "Manteca", state: "CA", zipCode: "95336", county: "San Joaquin", primaryServices: "A-GE, C-12, C-21", certifications: "", membershipTier: "Silver/VIP", dateJoined: "3/1/2025", renewalDate: "3/1/2026" },
  { email: "rami@solutionsgc.com", companyName: "Constructive Solutions", phone: "650-539-0900", address: "2041 Pioneer Court, Suite 208", city: "San Mateo", state: "CA", zipCode: "94403", county: "San Mateo", primaryServices: "B-GC", certifications: "", membershipTier: "Silver/VIP", dateJoined: "9/1/2024", renewalDate: "9/1/2025" },
  { email: "alex@westcoastinspect.com", companyName: "ARC Builders & Development", phone: "650-458-1200", address: "111 N Quebec St", city: "San Mateo", state: "CA", zipCode: "", county: "San Mateo", primaryServices: "B-GC", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "9/1/2024", renewalDate: "9/1/2025" },
  { email: "jherbert@foconinc.com", companyName: "Focon, Inc", phone: "510-593-6459", address: "1305 Franklin Street, Ste 301", city: "Oakland", state: "CA", zipCode: "94612", county: "Alameda", primaryServices: "A-GE, B-GC", certifications: "LIABE, SLBE, MBE, DBE, SBE/MSBE, SB (Micro)", membershipTier: "Silver/VIP", dateJoined: "11/1/2024", renewalDate: "11/1/2025" },
  { email: "noriegaplumbingsystems@gmail.com", companyName: "Noriega Plumbing Systems", phone: "209-229-0250", address: "5432 E Morada Lane", city: "Stockton", state: "CA", zipCode: "95212", county: "San Joaquin", primaryServices: "C-36", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "", renewalDate: "" },
  { email: "empireq11@hotmail.com", companyName: "Empire Quality Painting", phone: "916-837-8540", address: "5921 Belleview, Av 3", city: "Sacramento", state: "CA", zipCode: "95824", county: "Sacramento", primaryServices: "C-33", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "10/1/2024", renewalDate: "10/1/2024" },
  { email: "anoush@micahelectric.co", companyName: "Micah Electric Co.", phone: "510-710-0532", address: "3542 Fruitvale Ave. #101", city: "Oakland", state: "CA", zipCode: "94602", county: "Alameda", primaryServices: "C-10", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "11/1/2024", renewalDate: "11/1/2025" },
  { email: "deepali@marconcompany.com", companyName: "Mar Con Builders", phone: "510-993-6197", address: "8108 Capwell Dr.", city: "Oakland", state: "CA", zipCode: "94583", county: "Alameda", primaryServices: "B-GC, C-6, C-15, C-9", certifications: "DBE, MBE, SBE", membershipTier: "Silver/VIP", dateJoined: "11/1/2024", renewalDate: "11/1/2025" },
  { email: "dalex@rectifiedevci.com", companyName: "Rectified EV Charging & Electrical Services, LLC", phone: "415-964-5650", address: "548 Market St., 737823", city: "San Francisco", state: "CA", zipCode: "94104", county: "San Francisco", primaryServices: "C-10", certifications: "SBE", membershipTier: "Bronze/Standard", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "onthelevelconcrete@yahoo.com", companyName: "On the Level Concrete", phone: "415-407-3695", address: "1540 Davidson Ave", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "C-8", certifications: "DBE, LBE, SBE, MBE", membershipTier: "Silver/VIP", dateJoined: "10/1/2024", renewalDate: "10/1/2025" },
  { email: "zenith.davis@yahoo.com", companyName: "Zenith General Contractors Corp.", phone: "510-376-4142", address: "1271 Washington Ave, #631", city: "San Leandro", state: "CA", zipCode: "94577", county: "Alameda", primaryServices: "B-GC", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "1/28/2025", renewalDate: "2/1/2026" },
  { email: "jspencer@namcnorcal.org", companyName: "Joe Spencer", phone: "", address: "", city: "", state: "CA", zipCode: "", county: "", primaryServices: "Professional Services", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "10/1/2024", renewalDate: "10/1/2025" },
  { email: "nik@everwattlights.com", companyName: "EverWatt", phone: "510-488-8037", address: "30800 Santana Street", city: "Hayward", state: "CA", zipCode: "94544", county: "Alameda", primaryServices: "C-10", certifications: "", membershipTier: "Gold/Major Corp", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "lamontdawson@gmail.com", companyName: "Dawson Construction Management", phone: "510-593-5408", address: "", city: "Oakland", state: "CA", zipCode: "", county: "Alameda", primaryServices: "B-GC", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "", renewalDate: "" },
  { email: "depthconinc@gmail.com", companyName: "Depth Concrete", phone: "510-543-3007", address: "PO Box 23651", city: "Oakland", state: "CA", zipCode: "94623", county: "Alameda", primaryServices: "", certifications: "DBE, MBE", membershipTier: "Bronze/Standard", dateJoined: "", renewalDate: "" },
  { email: "mdunn@day-town.com", companyName: "Day-Town Construction", phone: "510-426-8514", address: "1503 McDonald Ave, Suite 3", city: "Richmond", state: "CA", zipCode: "94801", county: "Contra Costa", primaryServices: "B-GC", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "", renewalDate: "" },
  { email: "bainesgroupinc1110@sbcglobal.net", companyName: "Baines Group, Inc.", phone: "415-494-5672", address: "1485 Bayshore Blvd, Suite 381", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "B-GC", certifications: "WBE, MBE", membershipTier: "Bronze/Standard", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "samuela@sdadamscorp.com", companyName: "SDAC Lining Group, LLC", phone: "415-963-1153", address: "", city: "", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "MBE, LBE", membershipTier: "Bronze/Standard", dateJoined: "", renewalDate: "" },
  { email: "precisionhvacnorcal@gmail.com", companyName: "Precision HVAC", phone: "510-265-4440", address: "22962 Clawiter Road, Suite 24", city: "Hayward", state: "CA", zipCode: "94545", county: "Alameda", primaryServices: "C-20, EPA Universal Cert", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "info@bridgewayelectricinc.com", companyName: "Bridgeway Electric", phone: "510-239-7510", address: "8055 Collins Drive, #207", city: "Oakland", state: "CA", zipCode: "94621", county: "Alameda", primaryServices: "C-10", certifications: "SBE", membershipTier: "Bronze/Standard", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "efaust@ciriusengineering.com", companyName: "Cirius Engineering", phone: "415-404-5119", address: "1485 Bayshore Blvd, Suite 420 MB 134", city: "San Francisco", state: "CA", zipCode: "94124", county: "San Francisco", primaryServices: "CAD Drafting; MEP Drawings; Lighting Design", certifications: "SBE, DBE, LBE, MBE", membershipTier: "Bronze/Standard", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "authenticrete@gmail.com", companyName: "Authenticrete Construction, LLC", phone: "510-283-8441", address: "9327 International Blvd", city: "Oakland", state: "CA", zipCode: "94621", county: "Alameda", primaryServices: "C-8, B-GC", certifications: "", membershipTier: "Bronze/Standard", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "dmckinney@cpplumbing.net", companyName: "City Preferred Plumbing, Inc.", phone: "415-306-0866", address: "1 Embarcadero Center, Suite 1200", city: "San Francisco", state: "CA", zipCode: "94111", county: "San Francisco", primaryServices: "C-36", certifications: "", membershipTier: "Silver/VIP", dateJoined: "5/1/2025", renewalDate: "5/1/2026" },
  { email: "stanley@cooperce510.com", companyName: "Cooper Construction & Engineering", phone: "", address: "", city: "", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "DBE, SBE, VSLBE", membershipTier: "Bronze/Standard", dateJoined: "6/1/2025", renewalDate: "6/1/2026" },
  // === CORPORATE MEMBERS ===
  { email: "mpenn@swinerton.com", companyName: "Swinerton Builders", phone: "510-906-2271", address: "10 Clay Street, Suite 275", city: "Oakland", state: "CA", zipCode: "94607", county: "Alameda", primaryServices: "B-GC", certifications: "", membershipTier: "Corporate Partner", dateJoined: "7/2/2024", renewalDate: "7/2/2025" },
  { email: "bfjohnson@tcco.com", companyName: "Turner Construction", phone: "415-840-4589", address: "300 Frank H Ogawa Plz, Ste 510", city: "Oakland", state: "CA", zipCode: "94612", county: "Alameda", primaryServices: "B-GC", certifications: "", membershipTier: "Corporate Partner", dateJoined: "4/12/2024", renewalDate: "4/12/2025" },
  { email: "s.sullivan@webcor.com", companyName: "Webcor Builders", phone: "510-517-9637", address: "207 King Street, Suite 300", city: "San Francisco", state: "CA", zipCode: "94107", county: "San Francisco", primaryServices: "B-GC", certifications: "", membershipTier: "Corporate Partner", dateJoined: "", renewalDate: "" },
  { email: "jaquino@mccarthy.com", companyName: "McCarthy Builders Construction", phone: "408-813-6548", address: "1265 Battery Street, Third Fl", city: "San Francisco", state: "CA", zipCode: "94111", county: "San Francisco", primaryServices: "B-GC", certifications: "", membershipTier: "Corporate Partner", dateJoined: "3/25/2025", renewalDate: "3/25/2026" },
  { email: "hnutt@southlandind.com", companyName: "Southland Industries", phone: "800-613-6240", address: "33225 Western Avenue", city: "Union City", state: "CA", zipCode: "94587", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Corporate Partner", dateJoined: "10/1/2022", renewalDate: "" },
  { email: "tyrone.henry@deacon.com", companyName: "Deacon Construction, LLC", phone: "", address: "", city: "", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "", membershipTier: "Corporate Partner", dateJoined: "6/18/2024", renewalDate: "6/18/2025" },
  { email: "marivic.chennault@clarkconstruction.com", companyName: "Clark Construction", phone: "", address: "", city: "", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "", membershipTier: "Corporate Partner", dateJoined: "", renewalDate: "" },
  { email: "ddaniel@willdan.com", companyName: "Willdan", phone: "619-980-2504", address: "", city: "", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "", membershipTier: "Corporate Partner", dateJoined: "4/1/2025", renewalDate: "4/1/2026" },
  { email: "dan@ccselink.com", companyName: "Corporate Construction Services, Inc", phone: "916-390-7625", address: "5061 24th Street", city: "Sacramento", state: "CA", zipCode: "95822", county: "Sacramento", primaryServices: "B-GC", certifications: "", membershipTier: "Gold/Major Corp", dateJoined: "3/12/2024", renewalDate: "3/12/2025" },
  // === GOVERNMENT MEMBERS ===
  { email: "julie.ackerman@acgov.org", companyName: "Alameda County GSA", phone: "510-208-9607", address: "", city: "", state: "CA", zipCode: "", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Government Member", dateJoined: "11/1/2023", renewalDate: "11/1/2024" },
  { email: "kwilson@portoakland.com", companyName: "Port of Oakland", phone: "", address: "", city: "Oakland", state: "CA", zipCode: "", county: "Alameda", primaryServices: "", certifications: "", membershipTier: "Government Member", dateJoined: "12/1/2024", renewalDate: "12/1/2025" },
  { email: "beverly.johnson@ebmud.com", companyName: "East Bay Mud", phone: "", address: "", city: "Oakland", state: "CA", zipCode: "", county: "", primaryServices: "", certifications: "", membershipTier: "Government Member", dateJoined: "10/1/2024", renewalDate: "10/1/2025" },
];

async function syncMembers() {
  let updated = 0;
  let notFound = 0;
  const missed: string[] = [];

  for (const record of csvData) {
    // Find by email case-insensitively
    const existing = await db
      .select({ id: membershipApplications.id, email: membershipApplications.email })
      .from(membershipApplications)
      .where(ilike(membershipApplications.email, record.email))
      .limit(1);

    if (existing.length === 0) {
      notFound++;
      missed.push(record.email);
      continue;
    }

    const updateData: Record<string, any> = {
      companyName: record.companyName,
      county: record.county || null,
      membershipTier: record.membershipTier || null,
      dateJoined: record.dateJoined || null,
      renewalDate: record.renewalDate || null,
    };

    // Only update phone if CSV has a real value
    if (record.phone && record.phone.trim()) {
      updateData.phone = record.phone;
    }

    // Only update address fields if CSV has real values
    if (record.address && record.address.trim()) {
      updateData.address = record.address;
    }
    if (record.city && record.city.trim()) {
      updateData.city = record.city;
    }
    if (record.zipCode && record.zipCode.trim()) {
      updateData.zipCode = record.zipCode;
    }

    // Always update primaryServices and certifications from CSV
    if (record.primaryServices !== undefined) {
      updateData.primaryServices = record.primaryServices || null;
    }
    if (record.certifications !== undefined) {
      updateData.certifications = record.certifications || null;
    }

    await db
      .update(membershipApplications)
      .set(updateData)
      .where(eq(membershipApplications.id, existing[0].id));

    updated++;
    console.log(`✓ Updated: ${record.email} → ${record.companyName}`);
  }

  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  if (missed.length > 0) {
    console.log(`Missed emails:`, missed);
  }
}

syncMembers().catch(console.error);
