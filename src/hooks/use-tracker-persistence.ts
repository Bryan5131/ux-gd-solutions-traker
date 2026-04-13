import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sub, Tag, TrashItem } from "@/lib/tracker-types";
import { getInitialData, getInitialTags, TAB_NAMES, AXE_LABELS } from "@/lib/tracker-data";

export interface TrackerState {
  subs: Sub[][];
  tags: Tag[];
  gidCounter: number;
  tabNames: string[];
  axeLabels: string[];
  brouillon: string;
  trash: TrashItem[];
}

// Encode state into the subs JSONB field with a versioned wrapper
function encodeSubsField(state: TrackerState): any {
  return { v: 2, data: state.subs, tabNames: state.tabNames, axeLabels: state.axeLabels, brouillon: state.brouillon, trash: state.trash };
}

// Decode subs JSONB field — handles both old (raw array) and new (wrapped) formats
function decodeSubsField(raw: any): { subs: Sub[][]; tabNames: string[]; axeLabels: string[]; brouillon: string; trash: TrashItem[] } {
  if (raw && raw.v === 2) {
    return {
      subs: raw.data as Sub[][],
      tabNames: raw.tabNames ?? [...TAB_NAMES],
      axeLabels: raw.axeLabels ?? [...AXE_LABELS],
      brouillon: raw.brouillon ?? "",
      trash: raw.trash ?? [],
    };
  }
  // Legacy format: raw is Sub[][]
  return {
    subs: raw as Sub[][],
    tabNames: [...TAB_NAMES],
    axeLabels: [...AXE_LABELS],
    brouillon: "",
    trash: [],
  };
}

export function useTrackerPersistence() {
  const [state, setState] = useState<TrackerState | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("tracker_state")
          .select("*")
          .eq("id", "main")
          .maybeSingle();

        if (error) {
          console.error("Failed to load tracker state:", error);
          initWithDefaults();
          return;
        }

        if (data && data.subs) {
          const decoded = decodeSubsField(data.subs);
          setState({
            subs: decoded.subs,
            tags: data.tags as unknown as Tag[],
            gidCounter: data.gid_counter,
            tabNames: decoded.tabNames,
            axeLabels: decoded.axeLabels,
            brouillon: decoded.brouillon,
            trash: decoded.trash,
          });
        } else {
          // First time: seed with initial data
          await initWithDefaults();
        }
      } catch (err) {
        console.error("Failed to load tracker state:", err);
        initWithDefaults();
      } finally {
        setLoading(false);
      }
    }

    async function initWithDefaults() {
      const subs = getInitialData();
      const tags = getInitialTags();
      let gidCounter = 0;
      subs.forEach(tab => tab.forEach(s => s.groups.forEach(g => { gidCounter += g.features.length; })));
      gidCounter += 1;

      const newState: TrackerState = { subs, tags, gidCounter, tabNames: [...TAB_NAMES], axeLabels: [...AXE_LABELS], brouillon: "", trash: [] };
      setState(newState);

      // Insert into Supabase
      await supabase.from("tracker_state").upsert({
        id: "main",
        subs: encodeSubsField(newState) as any,
        tags: tags as any,
        gid_counter: gidCounter,
        updated_at: new Date().toISOString(),
      });
    }

    load();
  }, []);

  // Debounced save to Supabase
  const save = useCallback((newState: TrackerState) => {
    setState(newState);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from("tracker_state").update({
          subs: encodeSubsField(newState) as any,
          tags: newState.tags as any,
          gid_counter: newState.gidCounter,
          updated_at: new Date().toISOString(),
        }).eq("id", "main");

        if (error) console.error("Failed to save tracker state:", error);
      } catch (err) {
        console.error("Failed to save tracker state:", err);
      }
    }, 800);
  }, []);

  // Force immediate save
  const forceSave = useCallback(async (currentState: TrackerState) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setState(currentState);
    try {
      const { error } = await supabase.from("tracker_state").update({
        subs: encodeSubsField(currentState) as any,
        tags: currentState.tags as any,
        gid_counter: currentState.gidCounter,
        updated_at: new Date().toISOString(),
      }).eq("id", "main");
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to force save:", err);
      return false;
    }
  }, []);

  // Refresh from Supabase
  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tracker_state")
        .select("*")
        .eq("id", "main")
        .maybeSingle();
      if (error) throw error;
      if (data && data.subs) {
        const decoded = decodeSubsField(data.subs);
        const refreshed: TrackerState = {
          subs: decoded.subs,
          tags: data.tags as unknown as Tag[],
          gidCounter: data.gid_counter,
          tabNames: decoded.tabNames,
          axeLabels: decoded.axeLabels,
          brouillon: decoded.brouillon,
          trash: decoded.trash,
        };
        setState(refreshed);
        return refreshed;
      }
      return null;
    } catch (err) {
      console.error("Failed to refresh:", err);
      return null;
    }
  }, []);

  return { state, loading, save, forceSave, refresh };
}
