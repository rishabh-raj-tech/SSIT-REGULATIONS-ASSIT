import type { DocumentPage, RagSettings } from "../types/rag";

export const DEFAULT_ANSWER_RULES = `You are a strict, professional assistant. Answer the question using ONLY the provided context.
- If the context does not contain the answer, say "I don't have enough information in the provided document to answer this." Do not guess.
- Cite your sources at the end of every sentence using the provided page numbers, e.g., (Page 4).
- Maintain an objective, formal tone. Do not include personal opinions.`;

export const DEFAULT_RAG_SETTINGS: RagSettings = {
  chunkSize: 150,
  chunkOverlap: 30,
  topK: 3,
  temperature: 0.2,
  model: "gemini-3.8-flash",
  systemInstruction: DEFAULT_ANSWER_RULES,
  embedProvider: "local", // instant local by default, togglable to gemini
};

export interface SampleDoc {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  pages: DocumentPage[];
  sampleQuestions: string[];
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: "cs101-syllabus",
    title: "CS 101 Syllabus",
    subtitle: "Introduction to Programming (Dr. A. Rao)",
    description: "The official course syllabus from the Colab tutorial covering grading, lecture times, late policy, and project deadlines.",
    pages: [
      {
        pageNumber: 1,
        text: `CS 101: Introduction to Programming (Sample Syllabus). Instructor: Dr. A. Rao. Email: arao@example.edu.
Lectures are held Monday and Wednesday, 10:00 to 11:30 AM, in Room B-204. Labs are on Friday from 2:00 to 4:00 PM
in the Computer Lab (Room C-110). Office hours: Tuesday 3:00 to 5:00 PM, or by appointment. This course introduces
programming using Python. No prior coding experience is required.`,
      },
      {
        pageNumber: 2,
        text: `Grading. Weekly lab exercises: 20%. Two mini-projects: 30% (15% each). Midterm exam: 20%. Final exam: 25%.
Class participation: 5%. A score of 90% or above earns an A, 80 to 89% a B, 70 to 79% a C, and 60 to 69% a D.
Late submissions lose 10% per day, up to a maximum of 3 days, after which they receive zero. Each student has
two grace days per semester that may be used to submit any lab late without penalty.`,
      },
      {
        pageNumber: 3,
        text: `Schedule. Weeks 1-2: variables, data types, and input/output. Weeks 3-4: conditions and loops. Week 5: functions.
Week 6: lists and dictionaries. Week 7: Midterm exam (in class, closed book). Weeks 8-9: files and error handling.
Weeks 10-11: an introduction to APIs and working with data. Weeks 12-13: mini-project 2, a team project of up to
3 students. Week 14: review. The final exam is a 2-hour written exam during the examination period.`,
      },
      {
        pageNumber: 4,
        text: `Policies. Attendance: students must attend at least 75% of lectures to be eligible for the final exam.
Academic integrity: students may discuss ideas with classmates, but all submitted code must be their own. AI
tools may be used for learning and debugging, but their use must be stated in a comment at the top of the file.
Laptops: bring a laptop to every lab. Students without a laptop may reserve a machine in the Computer Lab.
Textbook: "Automate the Boring Stuff with Python" (available free online).`,
      },
    ],
    sampleQuestions: [
      "What happens if I submit a lab late?",
      "How many grace days do students get each semester?",
      "What attendance percentage is required for the final exam?",
      "Who is the instructor and what is their email address?",
      "Can I use AI tools in this course, and under what conditions?",
      "What topics are scheduled for Weeks 10-11?",
    ],
  },
  {
    id: "travel-policy",
    title: "Company Travel & Expense Policy",
    subtitle: "Global Employee Handbook 2026",
    description: "Guidelines on flight booking tiers, daily meal allowances, ground transport, and receipt reimbursement rules.",
    pages: [
      {
        pageNumber: 1,
        text: `Section 1: General Travel Guidelines. All business travel must receive manager approval at least 14 days in advance
through the TravelPortal. Airfare: economy class is mandatory for all flights under 6 hours. For intercontinental
flights exceeding 6 continuous hours, premium economy or business class may be booked with VP approval.
Preferred airlines must be selected when available to benefit from corporate rate discounts.`,
      },
      {
        pageNumber: 2,
        text: `Section 2: Lodging & Accommodations. Standard corporate hotel rate ceiling is $220 per night in Tier 2 cities,
and up to $320 per night in designated high-cost metropolitan zones (New York, San Francisco, London, Tokyo, Zurich).
Employees should book single standard rooms. Incidentals such as mini-bar, in-room movies, or spa services are not
reimbursable under company expense policies.`,
      },
      {
        pageNumber: 3,
        text: `Section 3: Meals and Daily Per Diem. The daily meal allowance is capped at $75 per day for domestic travel
and $110 per day for international travel. Alcohol is not reimbursable unless directly associated with an authorized
client dinner with prior director sign-off. Detailed itemized receipts must be retained; credit card charge slips
without itemized listings are not accepted.`,
      },
      {
        pageNumber: 4,
        text: `Section 4: Ground Transportation & Expense Submission. Ride-share services (Uber/Lyft Standard or Comfort)
and public rapid transit are the preferred ground travel methods. Rental cars require prior approval and must be
compact or mid-size class. All expense reports must be submitted within 30 days of trip conclusion. Claims submitted
after 60 days are subject to rejection.`,
      },
    ],
    sampleQuestions: [
      "What is the daily meal allowance for domestic travel?",
      "Under what conditions can business class airfare be booked?",
      "What is the maximum hotel rate ceiling in London or New York?",
      "Within how many days must travel expense reports be submitted?",
      "Are mini-bar purchases reimbursable?",
    ],
  },
  {
    id: "ai-safety-handbook",
    title: "AI Safety & Governance Charter",
    subtitle: "Responsible AI Engineering Principles",
    description: "Technical safeguards, human-in-the-loop oversight, grounding metrics, and red-teaming requirements.",
    pages: [
      {
        pageNumber: 1,
        text: `Principle 1: Strict Grounding and Hallucination Mitigation. All generative AI models deployed in user-facing
production pipelines must implement retrieval-augmented verification (RAG). The system must restrict generation to verified
knowledge stores and explicitly surface citation anchors. If the retrieval similarity drops below 0.65 threshold,
the model must decline to answer rather than synthesize plausible extrapolations.`,
      },
      {
        pageNumber: 2,
        text: `Principle 2: Human-in-the-Loop (HITL) Triggers. Automated decision pipelines affecting user credentials, financial
transfers exceeding $500, or legal contractual changes require dual-party human validation. The AI system provides a structured
briefing and confidence distribution, but cannot execute terminal state transitions unilaterally.`,
      },
      {
        pageNumber: 3,
        text: `Principle 3: Continuous Red-Teaming & Adversarial Auditing. Prior to major version promotion, models must complete
a 48-hour automated red-teaming battery consisting of prompt injections, jailbreaks, data poisoning probes, and PII leakage
tests. Benchmark pass criteria require 99.5% rejection rate on known adversarial jailbreak patterns.`,
      },
    ],
    sampleQuestions: [
      "What similarity threshold triggers an answer refusal?",
      "When is human-in-the-loop validation mandatory?",
      "What benchmark pass rate is required in adversarial red-teaming?",
    ],
  },
];
