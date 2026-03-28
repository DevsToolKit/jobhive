export interface PresetSummary {
  id: string;
  name: string;
  search_term: string;
  location: string | null;
  use_count: number;
  last_used: string | null;
}

export interface Preset extends PresetSummary {
  config: Record<string, unknown>;
  created_at: string;
}
