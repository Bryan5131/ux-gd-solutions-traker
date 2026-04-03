import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sub, Tag } from "@/lib/tracker-types";
import { getInitialData, getInitialTags } from "@/lib/tracker-data";

interface TrackerState {
  subs: Sub[][];
  tags: Tag[];
  gidCounter: number;
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

        if (data && data.subs && (data.subs as any[]).length > 0) {
          setState({
            subs: data.subs as unknown as Sub[][],
            tags: data.tags as unknown as Tag[],
            gidCounter: data.gid_counter,
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

      const newState = { subs, tags, gidCounter };
      setState(newState);

      // Insert into Supabase
      await supabase.from("tracker_state").upsert({
        id: "main",
        subs: subs as any,
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
          subs: newState.subs as any,
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
        subs: currentState.subs as any,
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
        const refreshed = {
          subs: data.subs as unknown as Sub[][],
          tags: data.tags as unknown as Tag[],
          gidCounter: data.gid_counter,
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
