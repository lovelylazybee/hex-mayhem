import { create } from 'zustand';
import { seasonApi } from '@/lib/api';

interface Season {
  id: number;
  name: string;
  number: number;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules: string;
  prizes: string;
}

interface SeasonState {
  currentSeason: Season | null;
  seasons: Season[];
  loading: boolean;
  fetchCurrentSeason: () => Promise<void>;
  fetchSeasons: () => Promise<void>;
}

export const useSeasonStore = create<SeasonState>((set) => ({
  currentSeason: null,
  seasons: [],
  loading: false,

  fetchCurrentSeason: async () => {
    set({ loading: true });
    try {
      const season = await seasonApi.getCurrent();
      set({ currentSeason: season, loading: false });
    } catch {
      set({
        currentSeason: {
          id: 7,
          name: 'S7 海克斯大乱斗战术探讨',
          number: 7,
          status: 'registering',
          startDate: '2026-06-15',
          endDate: '2026-07-15',
          registrationDeadline: '2026-06-10',
          rules: '',
          prizes: '',
        },
        loading: false,
      });
    }
  },

  fetchSeasons: async () => {
    set({ loading: true });
    try {
      const seasons = await seasonApi.getAll();
      set({ seasons, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
