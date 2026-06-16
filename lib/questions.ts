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

const PERSON_TYPES    = ["individual", "family"];
const ORG_TYPES       = ["company", "nonprofit", "institution", "government", "nation", "movement", "faith", "community"];
const HISTORICAL_TYPE = ["historical"];
const LIVE_TYPE       = ["live"];

export function getQuestions(whoKey: string): CategoryQuestions {

  // LIVE
  if (LIVE_TYPE.includes(whoKey)) {
    return {
      skipQ1: true,
      q1: { question: "", sub: "", options: [] },
      q2: {
        question: "Is what you are sharing accurate right now?",
        sub: "Things can change fast when something is still happening. Just be honest about what you know at this moment.",
        options: [
          { key: "confirmed",  label: "Yes, this is accurate as far as I know", note: "You are sharing what you are seeing or hearing." },
          { key: "unverified", label: "Some details are still unclear",          note: "Annie will show this as still developing. It is still worth sharing." },
        ],
      },
      q3: {
        question: "How do you want to appear?",
        sub: "You can update this after the experience is over.",
        options: [
          { key: "name",      label: "My real name",    note: "Your name as it appears on your profile." },
          { key: "chosen",    label: "A name I choose", note: "You will type it in on the next screen." },
          { key: "anonymous", label: "Anonymously",     note: "No name will show. Annie keeps your identity private." },
        ],
      },
    };
  }

  // HISTORICAL
  if (HISTORICAL_TYPE.includes(whoKey)) {
    return {
      q1: {
        question: "Did you or your community live through this?",
        sub: "Some historical accounts come from people who were there. Others are preserved by someone who came after. Both have a place here.",
        options: [
          { key: "yes",      label: "Yes, I or my community lived this",      note: "This is a firsthand account." },
          { key: "carrying", label: "I am preserving someone else's account", note: "You are the one keeping it alive, not the one who was there." },
        ],
      },
      q2: {
        question: "Do you have a source you can point to?",
        sub: "A source helps Annie give historical experiences the right context. If you do not have one, that is okay too.",
        options: [
          { key: "confirmed",  label: "Yes, I can cite a source", note: "You will have space to add it in the editor." },
          { key: "unverified", label: "No source available",      note: "Annie will note that this account is uncited." },
        ],
      },
      q3: {
        question: "How do you want to appear as the person sharing this?",
        sub: "The experience is the focus. How much you want to be seen alongside it is up to you.",
        options: [
          { key: "name",      label: "My name, as the one carrying this forward", note: "Your name appears alongside the experience." },
          { key: "anonymous", label: "No name",                                    note: "The experience stands on its own." },
        ],
      },
    };
  }

  // ORGANIZATIONS
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
        question: `Did ${orgLabel} go through this?`,
        sub: "Organizations can share something they experienced directly, or something they are keeping alive on behalf of others.",
        options: [
          { key: "yes",      label: `Yes, ${orgLabel} was part of this`, note: "This happened to or within your organization." },
          { key: "carrying", label: "We are sharing this on behalf of others", note: "Your organization is preserving or passing on an account from others." },
        ],
      },
      q2: {
        question: "Does this reflect your organization's position?",
        sub: "Annie gives context about where an account comes from. It helps people understand what they are reading.",
        options: [
          { key: "confirmed",  label: "Yes, this is our official account",  note: "Your organization stands behind what is written here." },
          { key: "unverified", label: "This is not an official position",   note: "Annie will note that this does not represent an official statement." },
        ],
      },
      q3: {
        question: "What name should appear with this?",
        sub: "Organizations appear by name here. Anonymous publishing is not available for organizational accounts.",
        options: [
          { key: "name",   label: "Our official name",   note: "The verified name of your organization." },
          { key: "chosen", label: "A specific name",     note: "A department, chapter, or representative name." },
        ],
      },
    };
  }

  // PERSON / FAMILY
  return {
    q1: {
      question: whoKey === "family"
        ? "Did your family go through this together?"
        : "Were you there when this happened?",
      sub: "Annie welcomes both personal accounts and experiences shared on behalf of someone else.",
      options: [
        { key: "yes",
          label: whoKey === "family" ? "Yes, our family went through this" : "Yes, I was there",
          note:  whoKey === "family" ? "This is your family's shared experience." : "You were there or you saw it yourself." },
        { key: "carrying",
          label: "I am sharing it on behalf of someone else",
          note:  "This happened to someone else and you are making sure it is not forgotten." },
      ],
    },
    q2: {
      question: "Is this true as far as you know?",
      sub: "Annie does not ask for proof. We just ask you to be honest about what you know and what you are not sure of.",
      options: [
        { key: "confirmed",  label: "Yes, I stand behind this",   note: "You are confident in what you have written." },
        { key: "unverified", label: "I cannot fully verify this", note: "Annie will note that. It is still worth sharing." },
      ],
    },
    q3: {
      question: "How do you want to appear?",
      sub: "You can change this any time after you publish.",
      options: [
        { key: "name",      label: "My real name",    note: "Your full name as it appears on your profile." },
        { key: "chosen",    label: "A name I choose", note: "You will type it in on the next screen." },
        { key: "anonymous", label: "Anonymously",     note: "No name will show. Annie keeps your identity private." },
      ],
    },
  };
}