// lib/questions.ts
// All question content keyed by category.
// Adding a new category = adding one entry here. Nothing else changes.

export type QuestionOption = {
  key: string;
  label: string;
  note?: string;
};

export type CategoryQuestions = {
  q1: { question: string; sub: string; options: QuestionOption[] };
  q2: { question: string; sub: string; options: QuestionOption[] };
  q3: { question: string; sub: string; options: QuestionOption[] };
  skipQ1?: boolean;
};

// Category groups
const PERSON_TYPES    = ["individual", "family"];
const ORG_TYPES       = ["company", "nonprofit", "institution", "government", "nation", "movement", "faith", "community"];
const HISTORICAL_TYPE = ["historical"];
const LIVE_TYPE       = ["live"];

export function getQuestions(whoKey: string): CategoryQuestions {

  // ── LIVE — skip Q1, only Q2 + Q3 ──────────────────────────────────────────
  if (LIVE_TYPE.includes(whoKey)) {
    return {
      skipQ1: true,
      q1: { question: "", sub: "", options: [] }, // unused
      q2: {
        question: "Is what you are sharing accurate as it unfolds?",
        sub: "Live experiences can change quickly. Be honest about what you know right now.",
        options: [
          { key: "confirmed",  label: "Yes, this is accurate as I know it", note: "You are reporting what you are witnessing." },
          { key: "unverified", label: "Some details are still unclear",      note: "Annie will mark this as developing. Still worth sharing." },
        ],
      },
      q3: {
        question: "How do you want to appear?",
        sub: "You can change this after the experience concludes.",
        options: [
          { key: "name",      label: "My real name",    note: "Your name as on your profile." },
          { key: "chosen",    label: "A name I choose", note: "You will enter it on the next screen." },
          { key: "anonymous", label: "Anonymously",     note: "No name shown. Annie protects your identity." },
        ],
      },
    };
  }

  // ── HISTORICAL ─────────────────────────────────────────────────────────────
  if (HISTORICAL_TYPE.includes(whoKey)) {
    return {
      q1: {
        question: "Are you the original source of this account?",
        sub: "Historical experiences can come from those who lived them or those who preserved them. Both matter.",
        options: [
          { key: "yes",      label: "I am the original source",     note: "You or your community lived this." },
          { key: "carrying", label: "I am preserving someone else's account", note: "You are the carrier, not the origin." },
        ],
      },
      q2: {
        question: "Can you cite a source for this account?",
        sub: "A source helps Annie present historical experiences with appropriate context.",
        options: [
          { key: "confirmed",  label: "Yes, I have a source I can cite",  note: "You will be able to add it in the editor." },
          { key: "unverified", label: "No source available",              note: "Annie will note this account is uncited." },
        ],
      },
      q3: {
        question: "How do you want to appear as the carrier?",
        sub: "The focus is on the experience, not the person sharing it.",
        options: [
          { key: "name",      label: "My name as the carrier",  note: "Your name appears alongside the experience." },
          { key: "anonymous", label: "Anonymous carrier",       note: "No name shown. The experience speaks for itself." },
        ],
      },
    };
  }

  // ── ORGANIZATIONS (company, nonprofit, institution, government, nation, movement, faith, community) ──
  if (ORG_TYPES.includes(whoKey)) {
    const orgLabel = {
      company:     "your company",
      nonprofit:   "your organization",
      institution: "your institution",
      government:  "your ministry or agency",
      nation:      "your nation",
      movement:    "your movement",
      faith:       "your faith community",
      community:   "your community",
    }[whoKey] || "your organization";

    return {
      q1: {
        question: `Did ${orgLabel} live through this directly?`,
        sub: "Organizations can share experiences they went through or accounts they are carrying forward on behalf of others.",
        options: [
          { key: "yes",      label: `Yes, ${orgLabel} was directly involved`, note: "This happened to or within your organization." },
          { key: "carrying", label: "We are carrying this forward for others",  note: "Your organization is preserving or sharing on behalf of others." },
        ],
      },
      q2: {
        question: "Does this reflect your official account?",
        sub: "Annie presents organizational experiences with appropriate context about their source.",
        options: [
          { key: "confirmed",  label: "Yes, this is our official account",    note: "Your organization stands behind this statement." },
          { key: "unverified", label: "This is not an official position",     note: "Annie will note this is not an official statement." },
        ],
      },
      q3: {
        question: "How do you want to appear?",
        sub: "Organizations are identified by name. Anonymous posting is not available for organizational accounts.",
        options: [
          { key: "name",   label: "Our official name",   note: "Your organization's verified name." },
          { key: "chosen", label: "A name we choose",    note: "A specific department, chapter, or representative name." },
        ],
      },
    };
  }

  // ── PERSON / FAMILY (default) ──────────────────────────────────────────────
  return {
    q1: {
      question: whoKey === "family"
        ? "Did your family live through this together?"
        : "Did you witness or live this experience?",
      sub: "Annie carries both personal accounts and experiences shared on behalf of others.",
      options: [
        { key: "yes",      label: whoKey === "family" ? "Yes, our family lived this" : "Yes, I was there",
          note: whoKey === "family" ? "This is your family's shared experience." : "You personally lived or witnessed this." },
        { key: "carrying", label: "I am carrying it forward",
          note: "This happened to someone else and you are preserving it." },
      ],
    },
    q2: {
      question: "Is this true to the best of your knowledge?",
      sub: "Annie does not require proof. But we ask you to be honest about what you know.",
      options: [
        { key: "confirmed",  label: "Yes, I confirm this is true",  note: "You stand behind this account." },
        { key: "unverified", label: "I cannot fully verify this",   note: "Annie will mark it as unverified. Still worth sharing." },
      ],
    },
    q3: {
      question: "How do you want to appear?",
      sub: "You can always change this later.",
      options: [
        { key: "name",      label: "My real name",    note: "Your full name as on your profile." },
        { key: "chosen",    label: "A name I choose", note: "You will enter it on the next screen." },
        { key: "anonymous", label: "Anonymously",     note: "No name shown. Annie protects your identity." },
      ],
    },
  };
}