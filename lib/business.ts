export const business = {
  email: "sales@dcorhome.com",
  experienceYears: 20,
  officeAddress: "Office no-2, 1st Floor, Wadhwa PBR, Sector 4, Palm Beach Rd, above The Bread Bar, Nerul West, Nerul, Navi Mumbai, Maharashtra 400706.",
  // Office only; no showroom, phone or opening hours have been confirmed.
  enquiryTypes: ["General Enquiry", "Curtain Fabric Enquiry", "Request a Quotation", "Measurement Assistance", "Product Information", "Other"],
};
export const officeDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.officeAddress)}`;
