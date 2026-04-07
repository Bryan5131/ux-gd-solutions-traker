import { Sub, Feature, ReducerAction } from "./tracker-types";

export function trackerReducer(subs: Sub[], action: ReducerAction): Sub[] {
  switch (action.type) {
    case "UF": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== action.gId) return g;
            return {
              ...g,
              features: g.features.map(feat => {
                if (feat.id !== action.fId) return feat;
                return { ...feat, [action.field!]: action.val };
              })
            };
          })
        };
      });
    }
    case "DF": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== action.gId) return g;
            return { ...g, features: g.features.filter(feat => feat.id !== action.fId) };
          })
        };
      });
    }
    case "AF": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== action.gId) return g;
            const maxId = g.features.reduce((m, f) => Math.max(m, f.id), 0);
            const newFeat: Feature = {
              id: maxId + 1,
              gid: action.newGid || 0,
              macro: "none",
              micro: "none",
              label: action.label || "",
              note: action.note || "",
              tags: []
            };
            return { ...g, features: [...g.features, newFeat] };
          })
        };
      });
    }
    case "TT": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== action.gId) return g;
            return {
              ...g,
              features: g.features.map(feat => {
                if (feat.id !== action.fId) return feat;
                const idx = feat.tags.indexOf(action.tagId!);
                const newTags = idx >= 0
                  ? feat.tags.filter(t => t !== action.tagId)
                  : [...feat.tags, action.tagId!];
                return { ...feat, tags: newTags };
              })
            };
          })
        };
      });
    }
    case "AG": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        const newGroup = {
          id: "g-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          name: action.name || "general",
          features: []
        };
        return { ...s, groups: [...s.groups, newGroup] };
      });
    }
    case "RG": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== action.gId) return g;
            return { ...g, name: action.name || g.name };
          })
        };
      });
    }
    case "DG": {
      return subs.map(s => {
        if (s.id !== action.subId) return s;
        const targetGroup = s.groups.find(g => g.id === action.gId);
        if (!targetGroup) return s;
        const orphans = targetGroup.features;
        const remaining = s.groups.filter(g => g.id !== action.gId);
        if (remaining.length === 0) {
          return {
            ...s,
            groups: [{
              id: "g-general-" + Date.now(),
              name: "general",
              features: orphans
            }]
          };
        }
        remaining[0] = {
          ...remaining[0],
          features: [...remaining[0].features, ...orphans]
        };
        return { ...s, groups: remaining };
      });
    }
    case "DS": {
      return subs.filter(s => s.id !== action.subId);
    }
    case "RS": {
      return subs.map(s => s.id !== action.subId ? s : { ...s, name: action.name || s.name });
    }
    case "AS": {
      const newSub: Sub = {
        id: "s-" + Date.now(),
        name: action.name || "Nouveau besoin",
        groups: [{
          id: "g-general-" + Date.now(),
          name: "general",
          features: []
        }]
      };
      return [...subs, newSub];
    }
    case "DROP_F": {
      const { subId, gId, tFId, drag } = action;
      if (!drag || !subId || !gId) return subs;
      // Remove feature from source
      let movedFeature: Feature | null = null;
      let result = subs.map(s => {
        if (s.id !== drag.subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== drag.gId) return g;
            const feat = g.features.find(f => f.id === drag.fId);
            if (feat) movedFeature = { ...feat };
            return { ...g, features: g.features.filter(f => f.id !== drag.fId) };
          })
        };
      });
      if (!movedFeature) return subs;
      // Insert at target
      result = result.map(s => {
        if (s.id !== subId) return s;
        return {
          ...s,
          groups: s.groups.map(g => {
            if (g.id !== gId) return g;
            const feats = [...g.features];
            const targetIdx = feats.findIndex(f => f.id === tFId);
            if (targetIdx >= 0) {
              feats.splice(targetIdx, 0, movedFeature!);
            } else {
              feats.push(movedFeature!);
            }
            return { ...g, features: feats };
          })
        };
      });
      return result;
    }
    case "DROP_G": {
      const { subId, tGId, drag } = action;
      if (!drag || !subId) return subs;
      return subs.map(s => {
        if (s.id !== subId) return s;
        const groups = [...s.groups];
        const fromIdx = groups.findIndex(g => g.id === drag.gId);
        const toIdx = groups.findIndex(g => g.id === tGId);
        if (fromIdx < 0 || toIdx < 0) return s;
        const [moved] = groups.splice(fromIdx, 1);
        groups.splice(toIdx, 0, moved);
        return { ...s, groups };
      });
    }
    case "DROP_S": {
      const { tSId, drag } = action;
      if (!drag) return subs;
      const arr = [...subs];
      const fromIdx = arr.findIndex(s => s.id === drag.subId);
      const toIdx = arr.findIndex(s => s.id === tSId);
      if (fromIdx < 0 || toIdx < 0) return subs;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    }
    case "REMOVE_TAG_GLOBAL": {
      return subs.map(s => ({
        ...s,
        groups: s.groups.map(g => ({
          ...g,
          features: g.features.map(f => ({
            ...f,
            tags: f.tags.filter(t => t !== action.tagId)
          }))
        }))
      }));
    }
    case "REPLACE_ALL": {
      return action.val as Sub[];
    }
    default:
      return subs;
  }
}

export function nextMacro(current: string): string {
  const order = ["none", "outdated", "kill", "horsmvp"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

export function nextMicro(current: string): string {
  const order = ["none", "doing", "done"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}
