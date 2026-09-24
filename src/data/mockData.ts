import { TeamMember, ClientCompany, Candidate } from "../types";

export const TEAM_MEMBERS: TeamMember[] = [
  // Team X Recruiters
  {
    id: "rec-1",
    name: "Bhavya",
    role: "recruiter",
    team: "Team X",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    email: "bhavya@rishijobs.com",
    phone: "+91 98201 12345",
  },
  {
    id: "rec-2",
    name: "Dheer",
    role: "recruiter",
    team: "Team X",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    email: "dheer@rishijobs.com",
    phone: "+91 98202 23456",
  },
  {
    id: "rec-3",
    name: "Virendra",
    role: "recruiter",
    team: "Team X",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    email: "virendra@rishijobs.com",
    phone: "+91 98203 34567",
  },
  {
    id: "rec-4",
    name: "Kimi",
    role: "recruiter",
    team: "Team X",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    email: "kimi@rishijobs.com",
    phone: "+91 98204 45678",
  },
  {
    id: "rec-5",
    name: "Dhrendra",
    role: "recruiter",
    team: "Team X",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    email: "dhrendra@rishijobs.com",
    phone: "+91 98205 56789",
  },

  // Project Managers
  {
    id: "pm-1",
    name: "Shweta",
    role: "pm",
    team: "Project Management",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    email: "shweta@rishijobs.com",
    phone: "+91 98206 67890",
  },
  {
    id: "pm-2",
    name: "Devanshi",
    role: "pm",
    team: "Project Management",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    email: "devanshi@rishijobs.com",
    phone: "+91 98207 78901",
  },
  {
    id: "pm-3",
    name: "Vanshika",
    role: "pm",
    team: "Project Management",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    email: "vanshika@rishijobs.com",
    phone: "+91 98208 89012",
  },

  // Agency Leadership
  {
    id: "admin-1",
    name: "Rishi Surana",
    role: "admin",
    team: "Leadership",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    email: "rishi@rishijobs.com",
    phone: "+91 98200 00000",
  },
];

// Clean slate as requested: user will add their real clients and candidates
export const CLIENT_COMPANIES: ClientCompany[] = [];

export const INITIAL_CANDIDATES: Candidate[] = [];
