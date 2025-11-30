import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type TeamRole = 'admin' | 'coordinator' | 'security' | 'medical' | 'support';
export type MemberStatus = 'active' | 'offline' | 'break' | 'responding';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  teamId: string;
  status: MemberStatus;
  location?: { lat: number; lng: number };
  lastSeen: string;
  phone?: string;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  eventId: string;
  members: TeamMember[];
  leaderId?: string;
  color?: string;
  createdAt: string;
}

interface TeamState {
  teams: Team[];
  selectedTeamId: string | null;
  isLoading: boolean;
}

interface TeamActions {
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  selectTeam: (id: string | null) => void;
  addMember: (teamId: string, member: TeamMember) => void;
  updateMember: (teamId: string, memberId: string, updates: Partial<TeamMember>) => void;
  removeMember: (teamId: string, memberId: string) => void;
  updateMemberLocation: (memberId: string, location: { lat: number; lng: number }) => void;
  updateMemberStatus: (memberId: string, status: MemberStatus) => void;
  getTeamById: (id: string) => Team | undefined;
  getMemberById: (id: string) => TeamMember | undefined;
  getTeamsByEvent: (eventId: string) => Team[];
  getActiveMembers: () => TeamMember[];
}

export const useTeamStore = create<TeamState & TeamActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        teams: [],
        selectedTeamId: null,
        isLoading: false,

        // Actions
        setTeams: (teams) =>
          set((state) => {
            state.teams = teams;
          }),

        addTeam: (team) =>
          set((state) => {
            state.teams.push(team);
          }),

        updateTeam: (id, updates) =>
          set((state) => {
            const index = state.teams.findIndex((t) => t.id === id);
            if (index !== -1) {
              state.teams[index] = { ...state.teams[index], ...updates };
            }
          }),

        deleteTeam: (id) =>
          set((state) => {
            state.teams = state.teams.filter((t) => t.id !== id);
            if (state.selectedTeamId === id) {
              state.selectedTeamId = null;
            }
          }),

        selectTeam: (id) =>
          set((state) => {
            state.selectedTeamId = id;
          }),

        addMember: (teamId, member) =>
          set((state) => {
            const team = state.teams.find((t) => t.id === teamId);
            if (team) {
              team.members.push(member);
            }
          }),

        updateMember: (teamId, memberId, updates) =>
          set((state) => {
            const team = state.teams.find((t) => t.id === teamId);
            if (team) {
              const memberIndex = team.members.findIndex((m) => m.id === memberId);
              if (memberIndex !== -1) {
                team.members[memberIndex] = { ...team.members[memberIndex], ...updates };
              }
            }
          }),

        removeMember: (teamId, memberId) =>
          set((state) => {
            const team = state.teams.find((t) => t.id === teamId);
            if (team) {
              team.members = team.members.filter((m) => m.id !== memberId);
            }
          }),

        updateMemberLocation: (memberId, location) =>
          set((state) => {
            for (const team of state.teams) {
              const member = team.members.find((m) => m.id === memberId);
              if (member) {
                member.location = location;
                member.lastSeen = new Date().toISOString();
                break;
              }
            }
          }),

        updateMemberStatus: (memberId, status) =>
          set((state) => {
            for (const team of state.teams) {
              const member = team.members.find((m) => m.id === memberId);
              if (member) {
                member.status = status;
                member.lastSeen = new Date().toISOString();
                break;
              }
            }
          }),

        getTeamById: (id) => get().teams.find((t) => t.id === id),

        getMemberById: (id) => {
          for (const team of get().teams) {
            const member = team.members.find((m) => m.id === id);
            if (member) return member;
          }
          return undefined;
        },

        getTeamsByEvent: (eventId) => get().teams.filter((t) => t.eventId === eventId),

        getActiveMembers: () => {
          const members: TeamMember[] = [];
          for (const team of get().teams) {
            members.push(...team.members.filter((m) => m.status === 'active'));
          }
          return members;
        },
      })),
      {
        name: 'team-storage',
        partialize: (state) => ({ teams: state.teams }),
      }
    ),
    { name: 'TeamStore' }
  )
);
