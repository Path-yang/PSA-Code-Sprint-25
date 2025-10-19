/**
 * PSA Product Team Escalation Contacts
 * Reference: Product Team Escalation Contacts Document
 * 
 * This file contains the escalation contact information for different modules.
 * Each module has designated Product Ops/Managers who handle escalations.
 */

export const escalationContacts = {
  Container: {
    module: "Container (CNTR)",
    contact: {
      name: "Mark Lee",
      title: "Product Ops Manager",
      email: "mark.lee@psa123.com"
    },
    role: "Oversee Container-related issues",
    escalationSteps: [
      "1. Notify Product Duty immediately.",
      "2. If unresolved, escalate to Manager on-call.",
      "3. Engage SRE/Infra team if needed."
    ]
  },
  
  Vessel: {
    module: "Vessel (VS)",
    contact: {
      name: "Jaden Smith",
      title: "Vessel Operations",
      email: "jaden.smith@psa123.com"
    },
    role: "Vessel management and troubleshooting",
    escalationSteps: [
      "1. Notify Vessel Duty team.",
      "2. If no response, escalate to Senior Ops Manager.",
      "3. Engage Vessel Static team for further diagnostics."
    ]
  },
  
  "EDI/API": {
    module: "EDI/API (EA)",
    contact: {
      name: "Tom Tan",
      title: "EDI/API Support",
      email: "tom.tan@psa123.com"
    },
    role: "Handle EDI/API issues (message validation, communication errors)",
    escalationSteps: [
      "1. Contact EDI/API team via on-call channel.",
      "2. In case of API failures, escalate to Infra/SRE.",
      "3. Engage partner if issue persists."
    ]
  },
  
  EDI: {
    module: "EDI/API (EA)",
    contact: {
      name: "Tom Tan",
      title: "EDI/API Support",
      email: "tom.tan@psa123.com"
    },
    role: "Handle EDI/API issues (message validation, communication errors)",
    escalationSteps: [
      "1. Contact EDI/API team via on-call channel.",
      "2. In case of API failures, escalate to Infra/SRE.",
      "3. Engage partner if issue persists."
    ]
  },
  
  API: {
    module: "EDI/API (EA)",
    contact: {
      name: "Tom Tan",
      title: "EDI/API Support",
      email: "tom.tan@psa123.com"
    },
    role: "Handle EDI/API issues (message validation, communication errors)",
    escalationSteps: [
      "1. Contact EDI/API team via on-call channel.",
      "2. In case of API failures, escalate to Infra/SRE.",
      "3. Engage partner if issue persists."
    ]
  },
  
  Infrastructure: {
    module: "Others - Infrastructure",
    contact: {
      name: "Jacky Chan",
      title: "Infra/SRE Support Lead",
      email: "jacky.chan@psa123.com"
    },
    role: "System infrastructure issues (e.g., latency, network)",
    escalationSteps: [
      "1. If system error detected, immediately engage Infra team.",
      "2. Escalate to Jacky Chan (SRE) for urgent cases."
    ]
  },
  
  Others: {
    module: "Others - General",
    contact: {
      name: "PSA Helpdesk",
      title: "General Support",
      email: "support@psa123.com"
    },
    role: "General helpdesk for inquiries and non-technical issues",
    escalationSteps: [
      "1. For non-urgent queries, escalate to team lead.",
      "2. For emergency issues, direct to on-call ops."
    ]
  }
};

/**
 * Get escalation contact information based on module name
 * @param {string} module - The module name (e.g., "Container", "Vessel", "EDI/API")
 * @returns {object|null} - Escalation contact information or null if not found
 */
export function getEscalationContact(module) {
  if (!module) return escalationContacts.Others;
  
  // Direct match
  if (escalationContacts[module]) {
    return escalationContacts[module];
  }
  
  // Partial match (case-insensitive)
  const moduleUpper = module.toUpperCase();
  
  if (moduleUpper.includes('CONTAINER') || moduleUpper.includes('CNTR')) {
    return escalationContacts.Container;
  }
  
  if (moduleUpper.includes('VESSEL') || moduleUpper.includes('VS')) {
    return escalationContacts.Vessel;
  }
  
  if (moduleUpper.includes('EDI') || moduleUpper.includes('API') || moduleUpper.includes('EA')) {
    return escalationContacts["EDI/API"];
  }
  
  if (moduleUpper.includes('INFRA') || moduleUpper.includes('SRE') || moduleUpper.includes('SYSTEM')) {
    return escalationContacts.Infrastructure;
  }
  
  // Default to Others
  return escalationContacts.Others;
}

/**
 * Format escalation contact for display
 * @param {string} module - The module name
 * @returns {object} - Formatted contact information for display
 */
export function formatEscalationContact(module) {
  const contactInfo = getEscalationContact(module);
  
  if (!contactInfo) return null;
  
  return {
    name: contactInfo.contact.name,
    title: contactInfo.contact.title,
    email: contactInfo.contact.email,
    role: contactInfo.role,
    steps: contactInfo.escalationSteps
  };
}

