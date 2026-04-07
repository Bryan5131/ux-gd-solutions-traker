import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Sub, Tag, Feature, ReducerAction } from "../lib/tracker-types";
import {
  lightTheme, darkTheme, getAxisColors, macroStatuses, microStatuses,
  getMacroBadgeColors, getMicroBadgeColors, TAG_PALETTE
} from "../lib/tracker-theme";
import { getInitialData, getInitialTags, TAB_NAMES, TAB_AXES, AXE_LABELS } from "../lib/tracker-data";
import { trackerReducer, nextMacro, nextMicro } from "../lib/tracker-reducer";
import { useTrackerPersistence } from "../hooks/use-tracker-persistence";

// ─── Font loader ──────────────────────────────────────────────
function useLexend() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
}

// ─── Mobile detection ─────────────────────────────────────────
function useIsMobileTracker() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── Main App ─────────────────────────────────────────────────
export default function TrackerApp() {
  useLexend();
  const { state: persistedState, loading, save, forceSave, refresh } = useTrackerPersistence();
  const isMobile = useIsMobileTracker();
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [allSubs, setAllSubs] = useState<Sub[][]>(() => getInitialData());
  const [allCollapsed, setAllCollapsed] = useState<Record<string, boolean>[]>([{}, {}, {}, {}]);
  const [tabNames, setTabNames] = useState<string[]>(() => [...TAB_NAMES]);
  const [axeLabels, setAxeLabels] = useState<string[]>(() => [...AXE_LABELS]);
  const [tags, setTags] = useState<Tag[]>(() => getInitialTags());
  const [gidCounter, setGidCounter] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // Sync from persisted state once loaded
  useEffect(() => {
    if (persistedState && !initialized) {
      setAllSubs(persistedState.subs);
      setTags(persistedState.tags);
      setGidCounter(persistedState.gidCounter);
      setTabNames(persistedState.tabNames);
      setAxeLabels(persistedState.axeLabels);
      setInitialized(true);
    }
  }, [persistedState, initialized]);

  const theme = dark ? darkTheme : lightTheme;

  // Auto-save on changes (after initialization)
  const saveTrigger = useRef(false);
  useEffect(() => {
    if (!initialized) return;
    if (!saveTrigger.current) {
      saveTrigger.current = true;
      return;
    }
    save({ subs: allSubs, tags, gidCounter, tabNames, axeLabels });
  }, [allSubs, tags, gidCounter, tabNames, axeLabels, initialized, save]);

  const getNextGid = useCallback(() => {
    const g = gidCounter;
    setGidCounter(prev => prev + 1);
    return g;
  }, [gidCounter]);

  const dispatch = useCallback((tabIndex: number, action: ReducerAction) => {
    setAllSubs(prev => {
      const copy = [...prev];
      copy[tabIndex] = trackerReducer(copy[tabIndex], action);
      return copy;
    });
  }, []);

  const findFeatureByGid = useCallback((gid: number): { feature: Feature; tabIndex: number; subId: string; gId: string } | null => {
    for (let t = 0; t < allSubs.length; t++) {
      for (const s of allSubs[t]) {
        for (const g of s.groups) {
          for (const f of g.features) {
            if (f.gid === gid) return { feature: f, tabIndex: t, subId: s.id, gId: g.id };
          }
        }
      }
    }
    return null;
  }, [allSubs]);

  // Filter state
  const [search, setSearch] = useState("");
  const [macroFilter, setMacroFilter] = useState("all");
  const [microFilter, setMicroFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [showNotes, setShowNotes] = useState(false);

  // Modal state
  const [deleteModal, setDeleteModal] = useState<{ tabIndex: number; subId: string; gId: string; fId: number; label: string } | null>(null);
  const [deleteSubModal, setDeleteSubModal] = useState<{ tabIndex: number; subId: string; label: string } | null>(null);
  const [newBesoinModal, setNewBesoinModal] = useState<number | null>(null);
  const [exportModal, setExportModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleForceSave = useCallback(async () => {
    setSaveStatus("saving");
    const ok = await forceSave({ subs: allSubs, tags, gidCounter, tabNames, axeLabels });
    setSaveStatus(ok ? "saved" : "error");
    setTimeout(() => setSaveStatus(null), 2000);
  }, [forceSave, allSubs, tags, gidCounter, tabNames, axeLabels]);

  const handleRefresh = useCallback(async () => {
    setSaveStatus("refreshing");
    const refreshed = await refresh();
    if (refreshed) {
      setAllSubs(refreshed.subs);
      setTags(refreshed.tags);
      setGidCounter(refreshed.gidCounter);
      setTabNames(refreshed.tabNames);
      setAxeLabels(refreshed.axeLabels);
      setSaveStatus("refreshed");
    } else {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus(null), 2000);
  }, [refresh]);

  const removeTagGlobal = useCallback((tagId: string) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
    setAllSubs(prev => prev.map(subs => trackerReducer(subs, { type: "REMOVE_TAG_GLOBAL", tagId })));
  }, []);

  const addTab = useCallback(() => {
    const newIndex = allSubs.length;
    setAllSubs(prev => [...prev, []]);
    setAllCollapsed(prev => [...prev, {}]);
    setTabNames(prev => [...prev, `Nouvel onglet ${newIndex + 1}`]);
    setActiveTab(newIndex);
  }, [allSubs.length]);

  const renameTab = useCallback((index: number, name: string) => {
    setTabNames(prev => {
      const copy = [...prev];
      copy[index] = name;
      return copy;
    });
  }, []);

  const renameAxe = useCallback((axeIndex: number, name: string) => {
    setAxeLabels(prev => {
      const copy = [...prev];
      copy[axeIndex] = name;
      return copy;
    });
  }, []);

  const totalFeatures = useMemo(() => {
    let c = 0;
    allSubs.forEach(tab => tab.forEach(s => s.groups.forEach(g => { c += g.features.length; })));
    return c;
  }, [allSubs]);

  const filteredFeatureCount = useCallback((tabIdx: number) => {
    let c = 0;
    allSubs[tabIdx].forEach(s => s.groups.forEach(g => { c += g.features.length; }));
    return c;
  }, [allSubs]);

  const matchesFilters = useCallback((f: Feature) => {
    if (search && !f.label.toLowerCase().includes(search.toLowerCase()) && !f.note.toLowerCase().includes(search.toLowerCase())) return false;
    if (macroFilter !== "all" && f.macro !== macroFilter) return false;
    if (microFilter !== "all" && f.micro !== microFilter) return false;
    if (tagFilter !== "all" && !f.tags.includes(tagFilter)) return false;
    return true;
  }, [search, macroFilter, microFilter, tagFilter]);

  // Collapse helpers
  const toggleCollapse = useCallback((tabIndex: number, key: string) => {
    setAllCollapsed(prev => {
      const copy = [...prev];
      copy[tabIndex] = { ...copy[tabIndex], [key]: !copy[tabIndex][key] };
      return copy;
    });
  }, []);

  const isOpen = useCallback((tabIndex: number, key: string) => {
    return !!allCollapsed[tabIndex][key];
  }, [allCollapsed]);

  const toggleAllSections = useCallback((tabIndex: number) => {
    const subs = allSubs[tabIndex];
    const current = allCollapsed[tabIndex];
    const anyOpen = Object.values(current).some(v => v);
    const newState: Record<string, boolean> = {};
    subs.forEach(s => {
      newState[s.id] = !anyOpen;
      s.groups.forEach(g => {
        newState[s.id + "-" + g.id] = !anyOpen;
      });
    });
    setAllCollapsed(prev => {
      const copy = [...prev];
      copy[tabIndex] = newState;
      return copy;
    });
  }, [allSubs, allCollapsed]);

  // CSV helpers
  const exportCsv = useCallback(() => {
    const rows = ["GID\tTab\tBesoin\tSous-groupe\tLabel\tMacro\tMicro\tNote"];
    allSubs.forEach((tab, ti) => {
      tab.forEach(s => {
        s.groups.forEach(g => {
          g.features.forEach(f => {
            const plainLabel = f.label.replace(/<[^>]*>/g, "");
            rows.push([f.gid, tabNames[ti] ?? TAB_NAMES[ti], s.name, g.name, plainLabel, f.macro, f.micro, f.note].join("\t"));
          });
        });
      });
    });
    return rows.join("\n");
  }, [allSubs]);

  const importCsv = useCallback((csv: string) => {
    try {
      const lines = csv.trim().split("\n").slice(1);
      const newData = getInitialData().map(() => [] as Sub[]);
      setAllSubs(getInitialData());
      return true;
    } catch {
      return false;
    }
  }, []);

  const containerStyle: React.CSSProperties = {
    fontFamily: "Lexend, sans-serif",
    background: theme.bg,
    color: theme.text,
    minHeight: "100vh",
    paddingBottom: isMobile ? 64 : 80,
  };

  if (loading || !initialized) {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 16, color: theme.textSub }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {activeTab === -1 ? (
        <AllView
          allSubs={allSubs}
          tags={tags}
          theme={theme}
          dark={dark}
          search={search}
          setSearch={setSearch}
          macroFilter={macroFilter}
          setMacroFilter={setMacroFilter}
          microFilter={microFilter}
          setMicroFilter={setMicroFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          matchesFilters={matchesFilters}
          dispatch={dispatch}
          totalFeatures={totalFeatures}
          removeTagGlobal={removeTagGlobal}
          setTags={setTags}
          isMobile={isMobile}
        />
      ) : (
        <TabContent
          key={activeTab}
          tabIndex={activeTab}
          tabName={tabNames[activeTab] ?? TAB_NAMES[activeTab]}
          subs={allSubs[activeTab]}
          collapsed={allCollapsed[activeTab]}
          tags={tags}
          theme={theme}
          dark={dark}
          dispatch={(action: ReducerAction) => dispatch(activeTab, action)}
          toggleCollapse={(key: string) => toggleCollapse(activeTab, key)}
          isOpen={(key: string) => isOpen(activeTab, key)}
          toggleAllSections={() => toggleAllSections(activeTab)}
          search={search}
          setSearch={setSearch}
          macroFilter={macroFilter}
          setMacroFilter={setMacroFilter}
          microFilter={microFilter}
          setMicroFilter={setMicroFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          matchesFilters={matchesFilters}
          findFeatureByGid={findFeatureByGid}
          getNextGid={getNextGid}
          setNewBesoinModal={setNewBesoinModal}
          onForceSave={handleForceSave}
          onRefresh={handleRefresh}
          saveStatus={saveStatus}
          removeTagGlobal={removeTagGlobal}
          setTags={setTags}
          setDeleteModal={(info: any) => setDeleteModal(info ? { ...info, tabIndex: activeTab } : null)}
          setDeleteSubModal={(info: any) => setDeleteSubModal(info ? { ...info, tabIndex: activeTab } : null)}
          isMobile={isMobile}
          onRenameTab={(name: string) => renameTab(activeTab, name)}
          axeLabel={axeLabels[TAB_AXES[activeTab]] ?? ""}
          onRenameAxe={(name: string) => renameAxe(TAB_AXES[activeTab] ?? 0, name)}
        />
      )}

      {/* Footer */}
      <Footer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dark={dark}
        setDark={setDark}
        theme={theme}
        isMobile={isMobile}
        tabNames={tabNames}
        onAddTab={addTab}
      />

      {/* Modals */}
      {deleteModal && (
        <ConfirmDeleteModal
          theme={theme}
          label={deleteModal.label}
          isMobile={isMobile}
          onCancel={() => setDeleteModal(null)}
          onConfirm={() => {
            dispatch(deleteModal.tabIndex, {
              type: "DF",
              subId: deleteModal.subId,
              gId: deleteModal.gId,
              fId: deleteModal.fId
            });
            setDeleteModal(null);
          }}
        />
      )}
      {deleteSubModal && (
        <ConfirmDeleteModal
          theme={theme}
          label={deleteSubModal.label}
          isMobile={isMobile}
          title="Supprimer cette catégorie ?"
          onCancel={() => setDeleteSubModal(null)}
          onConfirm={() => {
            dispatch(deleteSubModal.tabIndex, { type: "DS", subId: deleteSubModal.subId });
            setDeleteSubModal(null);
          }}
        />
      )}
      {newBesoinModal !== null && (
        <NewBesoinModal
          theme={theme}
          isMobile={isMobile}
          onCancel={() => setNewBesoinModal(null)}
          onAdd={(name: string) => {
            dispatch(newBesoinModal, { type: "AS", name });
            setNewBesoinModal(null);
          }}
        />
      )}
      {exportModal && (
        <ExportModal
          theme={theme}
          csv={exportCsv()}
          isMobile={isMobile}
          onClose={() => setExportModal(false)}
        />
      )}
      {importModal && (
        <ImportModal
          theme={theme}
          isMobile={isMobile}
          onCancel={() => setImportModal(false)}
          onImport={(csv: string) => {
            importCsv(csv);
            setImportModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────
function Footer({ activeTab, setActiveTab, dark, setDark, theme, isMobile, tabNames, onAddTab }: {
  activeTab: number;
  setActiveTab: (t: number) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  theme: any;
  isMobile: boolean;
  tabNames: string[];
  onAddTab: () => void;
}) {
  const footerStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: theme.surface,
    borderTop: "1px solid " + theme.border,
    boxShadow: dark ? "0 -4px 20px rgba(0,0,0,0.3)" : "0 -4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "stretch",
    zIndex: 1000,
    fontFamily: "Lexend, sans-serif",
    ...(isMobile ? {
      overflowX: "auto" as const,
      WebkitOverflowScrolling: "touch" as any,
      scrollbarWidth: "none" as any,
    } : {}),
  };

  return (
    <div style={footerStyle}>
      {/* ALL button */}
      <button
        onClick={() => setActiveTab(-1)}
        style={{
          padding: isMobile ? "10px 12px" : "13px 16px",
          fontSize: isMobile ? 10 : 11,
          fontWeight: activeTab === -1 ? 700 : 500,
          fontFamily: "Lexend, sans-serif",
          background: activeTab === -1 ? (dark ? "#2a2926" : "#e8e7e2") : "transparent",
          color: activeTab === -1 ? theme.text : theme.textSub,
          border: "none",
          cursor: "pointer",
          borderTop: activeTab === -1 ? "3px solid " + theme.text : "3px solid transparent",
          lineHeight: 1.4,
          whiteSpace: "nowrap" as const,
          flexShrink: 0,
        }}
      >
        ALL
      </button>
      <div style={{ width: 1, background: theme.border, alignSelf: "stretch", flexShrink: 0 }} />
      {/* Tab buttons */}
      {tabNames.map((name, i) => {
        const axis = getAxisColors(i, dark);
        const isActive = activeTab === i;
        return (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              flex: isMobile ? undefined : 1,
              padding: isMobile ? "10px 12px" : "13px 8px",
              fontSize: isMobile ? 10 : 11,
              fontWeight: isActive ? 700 : 400,
              fontFamily: "Lexend, sans-serif",
              background: isActive ? axis.accentLight : "transparent",
              color: isActive ? axis.accent : axis.accent + "8C",
              border: "none",
              borderTop: isActive ? "3px solid " + axis.accent : "3px solid transparent",
              cursor: "pointer",
              lineHeight: 1.4,
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            {name}
          </button>
        );
      })}
      {/* Add tab button */}
      <button
        onClick={onAddTab}
        title="Ajouter un onglet"
        style={{
          padding: isMobile ? "10px 10px" : "13px 14px",
          fontSize: isMobile ? 14 : 16,
          fontFamily: "Lexend, sans-serif",
          background: "transparent",
          color: theme.textSub,
          border: "none",
          cursor: "pointer",
          fontWeight: 400,
          whiteSpace: "nowrap" as const,
          flexShrink: 0,
          borderTop: "3px solid transparent",
        }}
      >
        +
      </button>
      <div style={{ width: 1, background: theme.border, alignSelf: "stretch", flexShrink: 0 }} />
      <button
        onClick={() => setDark(!dark)}
        style={{
          padding: isMobile ? "10px 12px" : "13px 16px",
          fontSize: isMobile ? 11 : 13,
          fontFamily: "Lexend, sans-serif",
          background: "transparent",
          color: theme.textSub,
          border: "none",
          cursor: "pointer",
          fontWeight: 500,
          whiteSpace: "nowrap" as const,
          flexShrink: 0,
        }}
      >
        {dark ? "Light" : "Dark"}
      </button>
    </div>
  );
}

// ─── Tab Content ──────────────────────────────────────────────
function TabContent({ tabIndex, tabName, subs, collapsed, tags, theme, dark, dispatch,
  toggleCollapse, isOpen, toggleAllSections, search, setSearch,
  macroFilter, setMacroFilter, microFilter, setMicroFilter,
  tagFilter, setTagFilter, showNotes, setShowNotes, matchesFilters,
  findFeatureByGid, getNextGid, setNewBesoinModal, onForceSave,
  onRefresh, saveStatus, removeTagGlobal, setTags, setDeleteModal, setDeleteSubModal, isMobile, onRenameTab,
  axeLabel, onRenameAxe
}: any) {
  const axis = getAxisColors(tabIndex, dark);
  const dragRef = useRef<any>({});
  const anyOpen = Object.values(collapsed).some((v: any) => v);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(tabName);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [editingAxe, setEditingAxe] = useState(false);
  const [axeValue, setAxeValue] = useState(axeLabel);
  const axeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) { titleInputRef.current?.select(); }
  }, [editingTitle]);

  useEffect(() => {
    if (editingAxe) { axeInputRef.current?.select(); }
  }, [editingAxe]);

  const commitTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed) onRenameTab(trimmed);
    setEditingTitle(false);
  };

  const commitAxe = () => {
    const trimmed = axeValue.trim();
    if (trimmed) onRenameAxe(trimmed);
    setEditingAxe(false);
  };

  return (
    <div style={{ maxWidth: 1800, margin: "0 auto", padding: isMobile ? "12px 8px" : "24px 16px" }}>
      {/* Page Header */}
      <div style={{ borderRadius: isMobile ? 14 : 20, overflow: "hidden", boxShadow: theme.shadowMd, marginBottom: isMobile ? "1.2rem" : "2.5rem" }}>
        <div style={{ background: axis.subGradient, padding: isMobile ? "10px 16px" : "14px 24px", textAlign: "center" as const }}>
          {editingAxe ? (
            <input
              ref={axeInputRef}
              value={axeValue}
              onChange={e => setAxeValue(e.target.value)}
              onBlur={commitAxe}
              onKeyDown={e => {
                if (e.key === "Enter") commitAxe();
                if (e.key === "Escape") { setAxeValue(axeLabel); setEditingAxe(false); }
              }}
              style={{
                fontSize: isMobile ? 10 : 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                fontFamily: "Lexend, sans-serif",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid " + axis.subText,
                outline: "none",
                color: axis.subText,
                textAlign: "center",
                width: "auto",
                minWidth: 80,
              }}
            />
          ) : (
            <span
              onDoubleClick={() => { setAxeValue(axeLabel); setEditingAxe(true); }}
              title="Double-clic pour renommer"
              style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, opacity: 0.8, color: axis.subText, cursor: "text" }}
            >
              {axeLabel}
            </span>
          )}
        </div>
        <div style={{ background: theme.surface, padding: isMobile ? "1.2rem 1rem" : "2rem 2.5rem", textAlign: "center" as const, borderTop: "4px solid " + axis.accent }}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") { setTitleValue(tabName); setEditingTitle(false); }
              }}
              style={{
                fontSize: isMobile ? 22 : 36,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: theme.text,
                fontFamily: "Lexend, sans-serif",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid " + axis.accent,
                outline: "none",
                textAlign: "center",
                width: "100%",
                maxWidth: 600,
              }}
            />
          ) : (
            <div
              onDoubleClick={() => { setTitleValue(tabName); setEditingTitle(true); }}
              title="Double-clic pour renommer"
              style={{ fontSize: isMobile ? 22 : 36, fontWeight: 700, letterSpacing: "-0.03em", color: theme.text, cursor: "text", display: "inline-block" }}
            >
              {tabName}
            </div>
          )}
          <div style={{ fontSize: isMobile ? 11 : 13, color: theme.textMuted, marginTop: isMobile ? 4 : 8 }}>
            {"\uD83C\uDFAF"} Objectifs utilisateurs
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        theme={theme} axis={axis} dark={dark}
        search={search} setSearch={setSearch}
        macroFilter={macroFilter} setMacroFilter={setMacroFilter}
        microFilter={microFilter} setMicroFilter={setMicroFilter}
        tagFilter={tagFilter} setTagFilter={setTagFilter}
        tags={tags}
        showNotes={showNotes} setShowNotes={setShowNotes}
        anyOpen={anyOpen} toggleAllSections={toggleAllSections}
        onForceSave={onForceSave}
        onRefresh={onRefresh}
        saveStatus={saveStatus}
        onNewBesoin={() => setNewBesoinModal(tabIndex)}
        isMobile={isMobile}
      />

      {/* Subs */}
      {subs.map((s: Sub) => (
        <SubSection
          key={s.id}
          sub={s}
          tabIndex={tabIndex}
          axis={axis}
          theme={theme}
          dark={dark}
          tags={tags}
          isOpen={isOpen(s.id)}
          toggleOpen={() => toggleCollapse(s.id)}
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          isGroupOpen={(gId: string) => isOpen(s.id + "-" + gId)}
          toggleGroupOpen={(gId: string) => toggleCollapse(s.id + "-" + gId)}
          dispatch={dispatch}
          matchesFilters={matchesFilters}
          showNotes={showNotes}
          findFeatureByGid={findFeatureByGid}
          getNextGid={getNextGid}
          dragRef={dragRef}
          removeTagGlobal={removeTagGlobal}
          setTags={setTags}
          setDeleteModal={setDeleteModal}
          setDeleteSubModal={setDeleteSubModal}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────
function Toolbar({ theme, axis, dark, search, setSearch, macroFilter, setMacroFilter,
  microFilter, setMicroFilter, tagFilter, setTagFilter, tags, showNotes, setShowNotes,
  anyOpen, toggleAllSections, onForceSave, onRefresh, saveStatus, onNewBesoin, isMobile }: any) {

  const [filtersOpen, setFiltersOpen] = useState(!isMobile);

  const ctrl: React.CSSProperties = {
    padding: isMobile ? "6px 10px" : "7px 12px",
    borderRadius: 8,
    border: "1px solid " + theme.border,
    background: theme.surface,
    fontSize: isMobile ? 11 : 12,
    fontFamily: "Lexend, sans-serif",
    color: theme.text,
    outline: "none",
    cursor: "pointer",
  };

  const statusLabel = saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus === "refreshing" ? "Refreshing..." : saveStatus === "refreshed" ? "Refreshed!" : saveStatus === "error" ? "Error!" : null;

  if (isMobile) {
    return (
      <div style={{ marginBottom: 16 }}>
        {/* Top row: search + filter toggle + new */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...ctrl, flex: 1, minWidth: 0, cursor: "text" }}
          />
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              ...ctrl,
              background: filtersOpen ? axis.accentLight : theme.surface,
              color: filtersOpen ? axis.accentText : theme.text,
              borderColor: filtersOpen ? axis.accent : theme.border,
              fontWeight: filtersOpen ? 600 : 400,
              flexShrink: 0,
            }}
          >
            {"\u2699"} Filtres
          </button>
          <button
            onClick={onNewBesoin}
            style={{
              ...ctrl,
              background: axis.accent,
              color: "#ffffff",
              fontWeight: 700,
              borderColor: axis.accent,
              flexShrink: 0,
              fontSize: 16,
              padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            +
          </button>
        </div>

        {/* Collapsible filters */}
        {filtersOpen && (
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 8 }}>
            <select value={macroFilter} onChange={e => setMacroFilter(e.target.value)} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
              <option value="all">Macro</option>
              {Object.entries(macroStatuses).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <select value={microFilter} onChange={e => setMicroFilter(e.target.value)} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
              <option value="all">Micro</option>
              {Object.entries(microStatuses).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
              <option value="all">Tag</option>
              {tags.map((t: Tag) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowNotes(!showNotes)}
              style={{
                ...ctrl,
                flex: "1 1 calc(50% - 3px)",
                background: showNotes ? axis.accentLight : theme.surface,
                color: showNotes ? axis.accentText : theme.text,
                borderColor: showNotes ? axis.accent : theme.border,
                fontWeight: showNotes ? 600 : 400,
              }}
            >
              {"\uD83D\uDCDD"} Notes
            </button>
            <button onClick={toggleAllSections} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
              {anyOpen ? "\u2191 Fermer" : "\u2193 Ouvrir"}
            </button>
            <button onClick={onForceSave} style={{ ...ctrl, flex: "1 1 calc(25% - 3px)" }} disabled={saveStatus === "saving"}>
              {"\uD83D\uDCBE"}
            </button>
            <button onClick={onRefresh} style={{ ...ctrl, flex: "1 1 calc(25% - 3px)" }} disabled={saveStatus === "refreshing"}>
              {"\uD83D\uDD04"}
            </button>
            {statusLabel && (
              <span style={{ fontSize: 10, color: saveStatus === "error" ? "#ef4444" : axis.accent, fontWeight: 500, alignSelf: "center" }}>
                {statusLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop toolbar (unchanged)
  return (
    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 20, alignItems: "center" }}>
      <input
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...ctrl, flex: "1 1 140px", minWidth: 120, cursor: "text" }}
      />
      <select value={macroFilter} onChange={e => setMacroFilter(e.target.value)} style={ctrl}>
        <option value="all">Macro</option>
        {Object.entries(macroStatuses).map(([k, v]) => (
          <option key={k} value={k}>{v.icon} {v.label}</option>
        ))}
      </select>
      <select value={microFilter} onChange={e => setMicroFilter(e.target.value)} style={ctrl}>
        <option value="all">Micro</option>
        {Object.entries(microStatuses).map(([k, v]) => (
          <option key={k} value={k}>{v.icon} {v.label}</option>
        ))}
      </select>
      <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={ctrl}>
        <option value="all">Tag</option>
        {tags.map((t: Tag) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      <button
        onClick={() => setShowNotes(!showNotes)}
        style={{
          ...ctrl,
          background: showNotes ? axis.accentLight : theme.surface,
          color: showNotes ? axis.accentText : theme.text,
          borderColor: showNotes ? axis.accent : theme.border,
          fontWeight: showNotes ? 600 : 400,
        }}
      >
        {"\uD83D\uDCDD"} Notes
      </button>
      <button onClick={toggleAllSections} style={ctrl}>
        {anyOpen ? "\u2191 Collapse all" : "\u2193 Open all"}
      </button>
      <div style={{ width: 1, height: 28, background: theme.border }} />
      <button onClick={onForceSave} style={ctrl} disabled={saveStatus === "saving"}>
        {"\uD83D\uDCBE"} Save
      </button>
      <button onClick={onRefresh} style={ctrl} disabled={saveStatus === "refreshing"}>
        {"\uD83D\uDD04"} Refresh
      </button>
      {statusLabel && (
        <span style={{ fontSize: 11, color: saveStatus === "error" ? "#ef4444" : axis.accent, fontWeight: 500 }}>
          {statusLabel}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button
        onClick={onNewBesoin}
        style={{
          ...ctrl,
          background: axis.accent,
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 10,
          borderColor: axis.accent,
        }}
      >
        + Besoin utilisateur
      </button>
    </div>
  );
}

// ─── Sub Section ──────────────────────────────────────────────
function SubSection({ sub, tabIndex, axis, theme, dark, tags, isOpen, toggleOpen,
  collapsed, toggleCollapse, isGroupOpen, toggleGroupOpen, dispatch, matchesFilters,
  showNotes, findFeatureByGid, getNextGid, dragRef, removeTagGlobal, setTags, setDeleteModal, setDeleteSubModal, isMobile }: any) {

  const featureCount = sub.groups.reduce((c: number, g: any) => c + g.features.length, 0);
  const showSingleGroup = sub.groups.length === 1 && sub.groups[0].name === "general";
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(sub.name);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Sub header */}
      <div
        draggable={!isMobile && !editing}
        onDragStart={() => { dragRef.current = { type: "sub", subId: sub.id }; }}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={() => {
          if (dragRef.current?.type === "sub") {
            dispatch({ type: "DROP_S", tSId: sub.id, drag: dragRef.current });
          }
        }}
        onClick={editing ? undefined : toggleOpen}
        style={{
          background: axis.subGradient,
          borderRadius: isMobile ? 10 : 12,
          padding: isMobile ? "12px 14px" : "16px 20px",
          cursor: editing ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 8 : 12,
          userSelect: "none" as const,
        }}
      >
        {!isMobile && <span style={{ fontSize: 12, color: axis.subText, opacity: 0.5, cursor: "grab" }}>{"\u2807"}</span>}
        {editing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={() => { dispatch({ type: "RS", subId: sub.id, name: editName.trim() || sub.name }); setEditing(false); }}
            onKeyDown={e => {
              if (e.key === "Enter") { dispatch({ type: "RS", subId: sub.id, name: editName.trim() || sub.name }); setEditing(false); }
              if (e.key === "Escape") { setEditName(sub.name); setEditing(false); }
            }}
            onClick={e => e.stopPropagation()}
            autoFocus
            style={{
              flex: 1, fontSize: isMobile ? 14 : 16, fontWeight: 700, color: axis.subText,
              background: "transparent", border: "none", borderBottom: "1px solid " + axis.subText,
              outline: "none", fontFamily: "Lexend, sans-serif",
            }}
          />
        ) : (
          <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: axis.subText, flex: 1, lineHeight: 1.3 }}>{sub.name}</span>
        )}
        <span style={{
          background: axis.subCountBg, color: axis.subCountText,
          borderRadius: 999, padding: isMobile ? "2px 8px" : "3px 10px", fontSize: isMobile ? 10 : 11, fontWeight: 600,
          whiteSpace: "nowrap" as const,
        }}>
          {featureCount} {isMobile ? "" : "solutions UX/GD"}
        </span>
        <button
          onClick={e => { e.stopPropagation(); setEditing(true); setEditName(sub.name); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: 0.5, padding: 2, color: axis.subText, flexShrink: 0 }}
        >
          {"\u270F\uFE0F"}
        </button>
        <button
          onClick={e => { e.stopPropagation(); setDeleteSubModal({ subId: sub.id, label: sub.name }); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, opacity: 0.5, padding: "2px 4px", color: axis.subText, flexShrink: 0, lineHeight: 1 }}
        >
          {"\u00D7"}
        </button>
        <span style={{
          fontSize: 14, color: axis.subText, transition: "transform 0.2s",
          transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
          display: "inline-block",
        }}>
          {"\u25BE"}
        </span>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: "8px 0 0 0" }}>
          {showSingleGroup ? (
            <GroupFeatures
              sub={sub}
              group={sub.groups[0]}
              axis={axis}
              theme={theme}
              dark={dark}
              tags={tags}
              dispatch={dispatch}
              matchesFilters={matchesFilters}
              showNotes={showNotes}
              findFeatureByGid={findFeatureByGid}
              getNextGid={getNextGid}
              dragRef={dragRef}
              removeTagGlobal={removeTagGlobal}
              setTags={setTags}
              setDeleteModal={setDeleteModal}
              tabIndex={tabIndex}
              isMobile={isMobile}
            />
          ) : (
            sub.groups.map((g: any) => (
              <GroupSection
                key={g.id}
                sub={sub}
                group={g}
                axis={axis}
                theme={theme}
                dark={dark}
                tags={tags}
                isOpen={isGroupOpen(g.id)}
                toggleOpen={() => toggleGroupOpen(g.id)}
                dispatch={dispatch}
                matchesFilters={matchesFilters}
                showNotes={showNotes}
                findFeatureByGid={findFeatureByGid}
                getNextGid={getNextGid}
                dragRef={dragRef}
                removeTagGlobal={removeTagGlobal}
                setTags={setTags}
                setDeleteModal={setDeleteModal}
                tabIndex={tabIndex}
                isMobile={isMobile}
              />
            ))
          )}
          <AddGroupButton sub={sub} dispatch={dispatch} theme={theme} />
        </div>
      )}
    </div>
  );
}

// ─── Group Section ────────────────────────────────────────────
function GroupSection({ sub, group, axis, theme, dark, tags, isOpen, toggleOpen,
  dispatch, matchesFilters, showNotes, findFeatureByGid, getNextGid, dragRef,
  removeTagGlobal, setTags, setDeleteModal, tabIndex, isMobile }: any) {

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  return (
    <div style={{ marginBottom: 6 }}>
      {/* Group header */}
      <div
        draggable={!isMobile}
        onDragStart={() => { dragRef.current = { type: "group", subId: sub.id, gId: group.id }; }}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={() => {
          if (dragRef.current?.type === "group") {
            dispatch({ type: "DROP_G", subId: sub.id, tGId: group.id, drag: dragRef.current });
          }
        }}
        style={{
          background: axis.groupGradient,
          border: "1px solid " + axis.groupBorder,
          borderRadius: 8,
          padding: isMobile ? "8px 10px" : "9px 14px",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 8,
          cursor: "pointer",
          userSelect: "none" as const,
        }}
        onClick={() => !editing && toggleOpen()}
      >
        {!isMobile && <span style={{ fontSize: 12, color: theme.textMuted, cursor: "grab" }}>{"\u2807"}</span>}
        {editing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { dispatch({ type: "RG", subId: sub.id, gId: group.id, name: editName }); setEditing(false); }
              if (e.key === "Escape") { setEditName(group.name); setEditing(false); }
            }}
            onClick={e => e.stopPropagation()}
            autoFocus
            style={{
              flex: 1, fontSize: isMobile ? 12 : 13, fontWeight: 600, fontFamily: "Lexend, sans-serif",
              background: "transparent", border: "none", color: axis.groupText, outline: "none",
            }}
          />
        ) : (
          <span style={{ flex: 1, fontSize: isMobile ? 12 : 13, fontWeight: 600, color: axis.groupText }}>{group.name}</span>
        )}
        <span style={{ fontSize: 11, color: theme.textMuted }}>{group.features.length}</span>
        <button
          onClick={e => { e.stopPropagation(); setEditing(true); setEditName(group.name); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: 0.5, padding: 2 }}
        >
          {"\u270F\uFE0F"}
        </button>
        <button
          onClick={e => { e.stopPropagation(); dispatch({ type: "DG", subId: sub.id, gId: group.id }); }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: 0.4, padding: 2, color: theme.textMuted }}
        >
          {"\u00D7"}
        </button>
        <span style={{
          fontSize: 14, color: axis.groupText, transition: "transform 0.2s",
          transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
          display: "inline-block",
        }}>
          {"\u25BE"}
        </span>
      </div>

      {isOpen && (
        <GroupFeatures
          sub={sub} group={group} axis={axis} theme={theme} dark={dark}
          tags={tags} dispatch={dispatch} matchesFilters={matchesFilters}
          showNotes={showNotes} findFeatureByGid={findFeatureByGid}
          getNextGid={getNextGid} dragRef={dragRef}
          removeTagGlobal={removeTagGlobal} setTags={setTags}
          setDeleteModal={setDeleteModal} tabIndex={tabIndex}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// ─── Group Features (shared between single-group and multi-group) ──
function GroupFeatures({ sub, group, axis, theme, dark, tags, dispatch, matchesFilters,
  showNotes, findFeatureByGid, getNextGid, dragRef, removeTagGlobal, setTags,
  setDeleteModal, tabIndex, isMobile }: any) {
  return (
    <div style={{ padding: "4px 0" }}>
      {group.features.filter(matchesFilters).map((f: Feature) => (
        <FeatureRow
          key={f.id}
          feature={f}
          sub={sub}
          group={group}
          axis={axis}
          theme={theme}
          dark={dark}
          tags={tags}
          dispatch={dispatch}
          showNotes={showNotes}
          dragRef={dragRef}
          removeTagGlobal={removeTagGlobal}
          setTags={setTags}
          setDeleteModal={setDeleteModal}
          tabIndex={tabIndex}
          isMobile={isMobile}
        />
      ))}
      <AddFeatureForm
        sub={sub}
        group={group}
        theme={theme}
        axis={axis}
        dispatch={dispatch}
        findFeatureByGid={findFeatureByGid}
        getNextGid={getNextGid}
        isMobile={isMobile}
      />
    </div>
  );
}

// ─── Feature Row ──────────────────────────────────────────────
function FeatureRow({ feature, sub, group, axis, theme, dark, tags, dispatch,
  showNotes, dragRef, removeTagGlobal, setTags, setDeleteModal, tabIndex, isMobile }: any) {

  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(feature.label);
  const [editNote, setEditNote] = useState(feature.note);
  const [noteVisible, setNoteVisible] = useState(false);
  const f = feature;

  const macroBadge = getMacroBadgeColors(f.macro, dark);
  const microBadge = getMicroBadgeColors(f.micro, dark);
  const rowBg = f.macro !== "none"
    ? macroBadge.bg + "CC"
    : theme.surface;

  const badgeStyle = (colors: any): React.CSSProperties => ({
    borderRadius: 6, padding: isMobile ? "2px 8px" : "3px 10px", fontSize: isMobile ? 10 : 11, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 4,
    background: colors.bg, border: "1px solid " + colors.border, color: colors.text,
    cursor: "pointer", fontFamily: "Lexend, sans-serif",
  });

  const showNote = (showNotes || noteVisible) && f.note;

  if (editing) {
    return (
      <div style={{ padding: isMobile ? "10px 12px" : "11px 16px", background: theme.surfaceAlt, borderRadius: 8, marginBottom: 2 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>#{f.id}</div>
        <input
          value={editLabel}
          onChange={e => setEditLabel(e.target.value)}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8,
            border: "1px solid " + theme.border, background: theme.surfaceAlt,
            fontSize: 13, fontFamily: "Lexend, sans-serif", color: theme.text,
            outline: "none", marginBottom: 8, boxSizing: "border-box" as const,
          }}
        />
        <textarea
          value={editNote}
          onChange={e => setEditNote(e.target.value)}
          placeholder="Note..."
          style={{
            width: "100%", height: 60, padding: "8px 12px", borderRadius: 8,
            border: "1px solid " + theme.border, background: theme.surfaceAlt,
            fontSize: 12, fontFamily: "Lexend, sans-serif", color: theme.text,
            outline: "none", resize: "vertical" as const, marginBottom: 8,
            boxSizing: "border-box" as const,
          }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setEditing(false)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid " + theme.border,
              background: theme.surface, fontSize: 12, fontFamily: "Lexend, sans-serif",
              color: theme.text, cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              dispatch({ type: "UF", subId: sub.id, gId: group.id, fId: f.id, field: "label", val: editLabel });
              dispatch({ type: "UF", subId: sub.id, gId: group.id, fId: f.id, field: "note", val: editNote });
              setEditing(false);
            }}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "none",
              background: "#00c48c", fontSize: 12, fontFamily: "Lexend, sans-serif",
              color: "#003d2e", cursor: "pointer", fontWeight: 600,
            }}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    );
  }

  // ─── MOBILE CARD LAYOUT ─────────────────────────────
  if (isMobile) {
    return (
      <div style={{ marginBottom: 2 }}>
        <div
          onClick={() => setEditing(true)}
          style={{
            padding: "10px 12px",
            background: rowBg,
            borderRadius: showNote ? "10px 10px 0 0" : 10,
            cursor: "default",
          }}
        >
          {/* Top row: GID + label */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.textMuted, flexShrink: 0, marginTop: 2 }}>#{f.gid}</span>
            {f.note && (
              <button
                onClick={(e) => { e.stopPropagation(); setNoteVisible(!noteVisible); }}
                style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 0,
                  opacity: (noteVisible || showNotes) ? 1 : 0.3, flexShrink: 0, marginTop: 1,
                }}
              >
                {"\uD83D\uDCDD"}
              </button>
            )}
            <span
              style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: f.label }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteModal({ subId: sub.id, gId: group.id, fId: f.id, label: f.label }); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: 0.3, padding: 0, color: theme.textMuted, flexShrink: 0 }}
            >
              {"\u00D7"}
            </button>
          </div>
          {/* Bottom row: badges + tags */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, alignItems: "center" }}>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: "UF", subId: sub.id, gId: group.id, fId: f.id, field: "macro", val: nextMacro(f.macro) }); }}
              style={badgeStyle(macroBadge)}
            >
              <span style={{ fontSize: 9 }}>{(macroStatuses as any)[f.macro]?.icon}</span>
              {(macroStatuses as any)[f.macro]?.label}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: "UF", subId: sub.id, gId: group.id, fId: f.id, field: "micro", val: nextMicro(f.micro) }); }}
              style={badgeStyle(microBadge)}
            >
              <span style={{ fontSize: 9 }}>{(microStatuses as any)[f.micro]?.icon}</span>
              {(microStatuses as any)[f.micro]?.label}
            </button>
            <TagArea
              feature={f} sub={sub} group={group} tags={tags}
              theme={theme} dark={dark} dispatch={dispatch}
              removeTagGlobal={removeTagGlobal} setTags={setTags}
              isMobile={isMobile}
            />
          </div>
        </div>
        {showNote && (
          <div style={{
            padding: "6px 12px 10px 12px",
            background: theme.noteBg, borderTop: "1px solid " + theme.noteBorder,
            borderRadius: "0 0 10px 10px",
          }}>
            <span style={{ fontSize: 11, color: theme.noteText, lineHeight: 1.7 }}>{f.note}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── DESKTOP ROW LAYOUT ─────────────────────────────
  return (
    <div style={{ marginBottom: 1 }}>
      <div
        draggable
        onDragStart={() => { dragRef.current = { type: "feature", subId: sub.id, gId: group.id, fId: f.id }; }}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={() => {
          if (dragRef.current?.type === "feature") {
            dispatch({ type: "DROP_F", subId: sub.id, gId: group.id, tFId: f.id, drag: dragRef.current });
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "11px 16px",
          gap: 8,
          background: rowBg,
          borderRadius: showNote ? "10px 10px 0 0" : 10,
          cursor: "default",
        }}
      >
        <span style={{ fontSize: 12, color: theme.textMuted, cursor: "grab", flexShrink: 0 }}>{"\u2807"}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, minWidth: 30, flexShrink: 0 }}>#{f.gid}</span>
        <div style={{ width: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {f.note && (
            <button
              onClick={() => setNoteVisible(!noteVisible)}
              style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0,
                opacity: (noteVisible || showNotes) ? 1 : 0.3,
              }}
            >
              {"\uD83D\uDCDD"}
            </button>
          )}
        </div>
        <span
          style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: f.label }}
        />
        <TagArea
          feature={f} sub={sub} group={group} tags={tags}
          theme={theme} dark={dark} dispatch={dispatch}
          removeTagGlobal={removeTagGlobal} setTags={setTags}
          isMobile={false}
        />
        <button
          onClick={() => dispatch({ type: "UF", subId: sub.id, gId: group.id, fId: f.id, field: "macro", val: nextMacro(f.macro) })}
          style={badgeStyle(macroBadge)}
        >
          <span style={{ fontSize: 10 }}>{(macroStatuses as any)[f.macro]?.icon}</span>
          {(macroStatuses as any)[f.macro]?.label}
        </button>
        <button
          onClick={() => dispatch({ type: "UF", subId: sub.id, gId: group.id, fId: f.id, field: "micro", val: nextMicro(f.micro) })}
          style={badgeStyle(microBadge)}
        >
          <span style={{ fontSize: 10 }}>{(microStatuses as any)[f.micro]?.icon}</span>
          {(microStatuses as any)[f.micro]?.label}
        </button>
        <button
          onClick={() => setEditing(true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: 0.4, padding: "2px 4px" }}
        >
          {"\u270F\uFE0F"}
        </button>
        <button
          onClick={() => setDeleteModal({ subId: sub.id, gId: group.id, fId: f.id, label: f.label })}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: 0.3, padding: "2px 4px", color: theme.textMuted }}
        >
          {"\u00D7"}
        </button>
      </div>
      {showNote && (
        <div style={{
          padding: "8px 16px 12px 80px",
          background: theme.noteBg, borderTop: "1px solid " + theme.noteBorder,
          borderRadius: "0 0 10px 10px",
        }}>
          <span style={{ fontSize: 12, color: theme.noteText, lineHeight: 1.7 }}>{f.note}</span>
        </div>
      )}
    </div>
  );
}

// ─── Tag Area ─────────────────────────────────────────────────
function TagArea({ feature, sub, group, tags, theme, dark, dispatch, removeTagGlobal, setTags, isMobile }: any) {
  const [open, setOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [newTagLabel, setNewTagLabel] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeTags = tags.filter((t: Tag) => feature.tags.includes(t.id));

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const, flexShrink: 0, position: "relative" as const }}>
      {activeTags.map((t: Tag) => (
        <span key={t.id} style={{
          background: t.color + "22", color: t.color, border: "1px solid " + t.color + "55",
          borderRadius: 999, padding: "2px 8px", fontSize: isMobile ? 10 : 11, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 3,
        }}>
          {t.label}
          <button
            onClick={(e) => { e.stopPropagation(); dispatch({ type: "TT", subId: sub.id, gId: group.id, fId: feature.id, tagId: t.id }); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.color, fontSize: 10, padding: 0 }}
          >
            {"\u00D7"}
          </button>
        </span>
      ))}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          background: theme.surfaceAlt, border: "1px solid " + theme.border,
          borderRadius: 999, padding: "2px 8px", fontSize: isMobile ? 10 : 11, cursor: "pointer",
          color: theme.textSub, fontFamily: "Lexend, sans-serif",
        }}
      >
        + tag
      </button>
      {open && (
        <div style={{
          position: "absolute" as const, top: "calc(100% + 6px)",
          left: isMobile ? "auto" : 0,
          right: isMobile ? 0 : "auto",
          zIndex: 9999,
          background: theme.surface, border: "1px solid " + theme.border,
          borderRadius: 10, padding: 8, minWidth: isMobile ? 180 : 200, boxShadow: theme.shadowMd,
        }}>
          <input
            value={tagSearch}
            onChange={e => setTagSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Search tags..."
            style={{
              width: "100%", padding: "5px 8px", borderRadius: 6,
              border: "1px solid " + theme.border, background: theme.surfaceAlt,
              fontSize: 11, fontFamily: "Lexend, sans-serif", color: theme.text,
              outline: "none", marginBottom: 6, boxSizing: "border-box" as const,
            }}
          />
          <div style={{ maxHeight: 180, overflowY: "auto" as const }}>
            {tags
              .filter((t: Tag) => t.label.toLowerCase().includes(tagSearch.toLowerCase()))
              .map((t: Tag) => {
                const isSelected = feature.tags.includes(t.id);
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "4px 6px",
                      cursor: "pointer", borderRadius: 4, fontSize: 11,
                    }}
                  >
                    <span
                      onClick={(e) => { e.stopPropagation(); dispatch({ type: "TT", subId: sub.id, gId: group.id, fId: feature.id, tagId: t.id }); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, cursor: "pointer" }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                      <span style={{ color: theme.text }}>{t.label}</span>
                      {isSelected && <span style={{ color: t.color, fontWeight: 700 }}>{"\u2713"}</span>}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTagGlobal(t.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: 10, padding: 0 }}
                    >
                      {"\u00D7"}
                    </button>
                  </div>
                );
              })}
          </div>
          <div style={{ borderTop: "1px solid " + theme.border, marginTop: 6, paddingTop: 6, display: "flex", gap: 4 }}>
            <input
              value={newTagLabel}
              onChange={e => setNewTagLabel(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="New tag..."
              onKeyDown={e => {
                if (e.key === "Enter" && newTagLabel.trim()) {
                  const color = TAG_PALETTE[tags.length % TAG_PALETTE.length];
                  const id = "t-" + Date.now();
                  setTags((prev: Tag[]) => [...prev, { id, label: newTagLabel.trim(), color }]);
                  setNewTagLabel("");
                }
              }}
              style={{
                flex: 1, padding: "4px 8px", borderRadius: 6,
                border: "1px solid " + theme.border, background: theme.surfaceAlt,
                fontSize: 11, fontFamily: "Lexend, sans-serif", color: theme.text, outline: "none",
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (newTagLabel.trim()) {
                  const color = TAG_PALETTE[tags.length % TAG_PALETTE.length];
                  const id = "t-" + Date.now();
                  setTags((prev: Tag[]) => [...prev, { id, label: newTagLabel.trim(), color }]);
                  setNewTagLabel("");
                }
              }}
              style={{
                padding: "4px 8px", borderRadius: 6, border: "none",
                background: theme.border, fontSize: 11, cursor: "pointer",
                color: theme.text, fontFamily: "Lexend, sans-serif",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Feature Form ─────────────────────────────────────────
function AddFeatureForm({ sub, group, theme, axis, dispatch, findFeatureByGid, getNextGid, isMobile }: any) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState("");

  const isDuplicate = /^#\d+$/.test(label.trim());

  const handleSubmit = () => {
    if (!label.trim()) return;
    if (isDuplicate) {
      const gid = parseInt(label.trim().slice(1));
      const found = findFeatureByGid(gid);
      if (found) {
        dispatch({ type: "AF", subId: sub.id, gId: group.id, label: found.feature.label, note: found.feature.note, newGid: getNextGid() });
        setLabel("");
        setNote("");
        setError("");
      } else {
        setError("GID #" + gid + " not found");
      }
    } else {
      dispatch({ type: "AF", subId: sub.id, gId: group.id, label: label.trim(), note, newGid: getNextGid() });
      setLabel("");
      setNote("");
      setError("");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "6px 12px", fontSize: 11, fontFamily: "Lexend, sans-serif",
          background: "transparent", border: "1px dashed " + theme.border,
          borderRadius: 8, color: theme.textMuted, cursor: "pointer",
          marginTop: 4, width: "100%", textAlign: "left" as const,
        }}
      >
        + Solution UX/GD
      </button>
    );
  }

  return (
    <div style={{ padding: "8px 0", marginTop: 4 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: isMobile ? "wrap" as const : "nowrap" as const }}>
        <div style={{ flex: "1 1 auto", position: "relative" as const, minWidth: isMobile ? "100%" : 0 }}>
          <input
            value={label}
            onChange={e => { setLabel(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") setOpen(false); }}
            placeholder={isMobile ? "Nom ou #42 pour dupliquer" : "Nom de la solution, ou #42 pour dupliquer"}
            autoFocus
            style={{
              width: "100%", padding: "7px 12px", borderRadius: 8,
              border: "1px solid " + theme.border,
              background: isDuplicate ? theme.noteBg : theme.surfaceAlt,
              color: isDuplicate ? theme.noteText : theme.text,
              fontSize: 12, fontFamily: "Lexend, sans-serif", outline: "none",
              boxSizing: "border-box" as const,
            }}
          />
          {isDuplicate && (
            <span style={{
              position: "absolute" as const, right: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 10, color: theme.noteText, opacity: 0.7,
            }}>
              {"\u2192"} dupliquer
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setShowNote(!showNote)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: showNote ? 1 : 0.4 }}
          >
            {"\uD83D\uDCDD"}
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "6px 12px", borderRadius: 6, border: "none",
              background: axis.accent, color: "#fff", fontSize: 12,
              fontFamily: "Lexend, sans-serif", cursor: "pointer", fontWeight: 600,
            }}
          >
            OK
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: "6px 10px", borderRadius: 6, border: "none",
              background: "transparent", color: theme.textMuted, fontSize: 14,
              cursor: "pointer",
            }}
          >
            {"\u00D7"}
          </button>
        </div>
      </div>
      {showNote && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Note..."
          style={{
            width: "100%", height: 50, padding: "7px 12px", borderRadius: 8,
            border: "1px solid " + theme.border, background: theme.surfaceAlt,
            fontSize: 11, fontFamily: "Lexend, sans-serif", color: theme.text,
            outline: "none", resize: "vertical" as const, marginTop: 6,
            boxSizing: "border-box" as const,
          }}
        />
      )}
      {error && <div style={{ fontSize: 11, color: "#e24b4a", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

// ─── Add Group Button ─────────────────────────────────────────
function AddGroupButton({ sub, dispatch, theme }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "5px 10px", fontSize: 10, fontFamily: "Lexend, sans-serif",
          background: "transparent", border: "1px dashed " + theme.border,
          borderRadius: 6, color: theme.textMuted, cursor: "pointer", marginTop: 4,
        }}
      >
        + Sous-categorie
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && name.trim()) { dispatch({ type: "AG", subId: sub.id, name: name.trim() }); setName(""); setOpen(false); }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Nom du sous-groupe"
        autoFocus
        style={{
          flex: 1, padding: "5px 10px", borderRadius: 6,
          border: "1px solid " + theme.border, background: theme.surfaceAlt,
          fontSize: 11, fontFamily: "Lexend, sans-serif", color: theme.text, outline: "none",
        }}
      />
      <button
        onClick={() => { if (name.trim()) { dispatch({ type: "AG", subId: sub.id, name: name.trim() }); setName(""); setOpen(false); } }}
        style={{
          padding: "5px 10px", borderRadius: 6, border: "none",
          background: theme.border, fontSize: 11, cursor: "pointer",
          color: theme.text, fontFamily: "Lexend, sans-serif",
        }}
      >
        OK
      </button>
    </div>
  );
}

// ─── ALL View ─────────────────────────────────────────────────
function AllView({ allSubs, tags, theme, dark, search, setSearch,
  macroFilter, setMacroFilter, microFilter, setMicroFilter,
  tagFilter, setTagFilter, showNotes, setShowNotes, matchesFilters,
  dispatch, totalFeatures, removeTagGlobal, setTags, isMobile }: any) {

  // Collect all features with metadata
  const allFeatures: { f: Feature; tabIndex: number; subName: string; groupName: string; sub: Sub; group: any }[] = [];
  allSubs.forEach((tab: Sub[], ti: number) => {
    tab.forEach((s: Sub) => {
      s.groups.forEach((g: any) => {
        g.features.forEach((f: Feature) => {
          allFeatures.push({ f, tabIndex: ti, subName: s.name, groupName: g.name, sub: s, group: g });
        });
      });
    });
  });

  const filtered = allFeatures.filter(item => matchesFilters(item.f));

  const ctrl: React.CSSProperties = {
    padding: isMobile ? "6px 10px" : "7px 12px",
    borderRadius: 8,
    border: "1px solid " + theme.border,
    background: theme.surface,
    fontSize: isMobile ? 11 : 12,
    fontFamily: "Lexend, sans-serif",
    color: theme.text,
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 1800, margin: "0 auto", padding: isMobile ? "12px 8px" : "24px 16px" }}>
      {/* Header */}
      <div style={{ borderRadius: isMobile ? 14 : 20, overflow: "hidden", boxShadow: theme.shadowMd, marginBottom: isMobile ? "1.2rem" : "2.5rem" }}>
        <div style={{ background: "linear-gradient(135deg, #2a2926, #1a1915)", padding: isMobile ? "10px 16px" : "14px 24px" }}>
          <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, opacity: 0.8, color: "#f0ede6" }}>
            Vue globale
          </span>
        </div>
        <div style={{ background: theme.surface, padding: isMobile ? "1.2rem 1rem" : "2rem 2.5rem", textAlign: "center" as const, borderTop: "4px solid " + theme.textSub }}>
          <div style={{ fontSize: isMobile ? 20 : 36, fontWeight: 700, letterSpacing: "-0.03em", color: theme.text }}>
            {isMobile ? "Toutes les solutions" : "Toutes les solutions UX/GD"}
          </div>
          <div style={{ fontSize: isMobile ? 11 : 13, color: theme.textMuted, marginTop: isMobile ? 4 : 8 }}>
            {"\uD83C\uDFAF"} {filtered.length} / {totalFeatures} solutions
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {isMobile ? (
        <MobileAllToolbar
          ctrl={ctrl} theme={theme} search={search} setSearch={setSearch}
          macroFilter={macroFilter} setMacroFilter={setMacroFilter}
          microFilter={microFilter} setMicroFilter={setMicroFilter}
          tagFilter={tagFilter} setTagFilter={setTagFilter}
          tags={tags} showNotes={showNotes} setShowNotes={setShowNotes}
        />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 20, alignItems: "center" }}>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...ctrl, flex: "1 1 140px", minWidth: 120, cursor: "text" }} />
          <select value={macroFilter} onChange={e => setMacroFilter(e.target.value)} style={ctrl}>
            <option value="all">Macro</option>
            {Object.entries(macroStatuses).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={microFilter} onChange={e => setMicroFilter(e.target.value)} style={ctrl}>
            <option value="all">Micro</option>
            {Object.entries(microStatuses).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={ctrl}>
            <option value="all">Tag</option>
            {tags.map((t: Tag) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              ...ctrl,
              background: showNotes ? "#e6faf4" : theme.surface,
              color: showNotes ? "#005540" : theme.text,
              borderColor: showNotes ? "#00c48c" : theme.border,
              fontWeight: showNotes ? 600 : 400,
            }}
          >
            {"\uD83D\uDCDD"} Notes
          </button>
        </div>
      )}

      {/* Feature rows */}
      {filtered.map(item => {
        const axis = getAxisColors(item.tabIndex, dark);
        const macroBadge = getMacroBadgeColors(item.f.macro, dark);
        const microBadge = getMicroBadgeColors(item.f.micro, dark);
        const showNote = showNotes && item.f.note;

        const badgeStyle = (colors: any): React.CSSProperties => ({
          borderRadius: 6, padding: isMobile ? "2px 8px" : "3px 10px", fontSize: isMobile ? 10 : 11, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 4,
          background: colors.bg, border: "1px solid " + colors.border, color: colors.text,
          cursor: "pointer", fontFamily: "Lexend, sans-serif",
        });

        if (isMobile) {
          return (
            <div key={item.tabIndex + "-" + item.f.gid} style={{ marginBottom: 2 }}>
              <div style={{
                padding: "10px 12px",
                background: item.f.macro !== "none" ? macroBadge.bg + "CC" : theme.surface,
                borderRadius: showNote ? "10px 10px 0 0" : 10,
              }}>
                {/* Top: breadcrumb + label */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, background: axis.accent + "18",
                    border: "1px solid " + axis.accent + "44", color: axis.accent,
                    borderRadius: 4, padding: "1px 5px", flexShrink: 0, marginTop: 2,
                  }}>
                    #{item.f.gid}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: theme.textMuted, marginBottom: 2 }}>
                      <span style={{ color: axis.accent, fontWeight: 600 }}>{item.subName}</span>
                      {item.groupName !== "general" && <span>{" \u203A "}{item.groupName}</span>}
                    </div>
                    <span style={{ fontSize: 12, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: item.f.label }} />
                  </div>
                </div>
                {/* Bottom: badges */}
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, alignItems: "center" }}>
                  <button
                    onClick={() => dispatch(item.tabIndex, {
                      type: "UF", subId: item.sub.id, gId: item.group.id,
                      fId: item.f.id, field: "macro", val: nextMacro(item.f.macro)
                    })}
                    style={badgeStyle(macroBadge)}
                  >
                    <span style={{ fontSize: 9 }}>{(macroStatuses as any)[item.f.macro]?.icon}</span>
                    {(macroStatuses as any)[item.f.macro]?.label}
                  </button>
                  <button
                    onClick={() => dispatch(item.tabIndex, {
                      type: "UF", subId: item.sub.id, gId: item.group.id,
                      fId: item.f.id, field: "micro", val: nextMicro(item.f.micro)
                    })}
                    style={badgeStyle(microBadge)}
                  >
                    <span style={{ fontSize: 9 }}>{(microStatuses as any)[item.f.micro]?.icon}</span>
                    {(microStatuses as any)[item.f.micro]?.label}
                  </button>
                  <TagArea
                    feature={item.f} sub={item.sub} group={item.group}
                    tags={tags} theme={theme} dark={dark}
                    dispatch={(action: ReducerAction) => dispatch(item.tabIndex, action)}
                    removeTagGlobal={removeTagGlobal} setTags={setTags}
                    isMobile={true}
                  />
                </div>
              </div>
              {showNote && (
                <div style={{
                  padding: "6px 12px 10px 12px",
                  background: theme.noteBg, borderTop: "1px solid " + theme.noteBorder,
                  borderRadius: "0 0 10px 10px",
                }}>
                  <span style={{ fontSize: 11, color: theme.noteText, lineHeight: 1.7 }}>{item.f.note}</span>
                </div>
              )}
            </div>
          );
        }

        // Desktop AllView row
        return (
          <div key={item.tabIndex + "-" + item.f.gid} style={{ marginBottom: 1 }}>
            <div style={{
              display: "flex", alignItems: "center", padding: "11px 16px", gap: 8,
              background: item.f.macro !== "none" ? macroBadge.bg + "CC" : theme.surface,
              borderRadius: showNote ? "10px 10px 0 0" : 10,
            }}>
              {/* GID pill */}
              <span style={{
                fontSize: 10, fontWeight: 700, background: axis.accent + "18",
                border: "1px solid " + axis.accent + "44", color: axis.accent,
                borderRadius: 6, padding: "2px 6px", minWidth: 30, textAlign: "center" as const, flexShrink: 0,
              }}>
                #{item.f.gid}
              </span>
              {/* Note col */}
              <div style={{ width: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.f.note && <span style={{ fontSize: 12, opacity: showNotes ? 1 : 0.3 }}>{"\uD83D\uDCDD"}</span>}
              </div>
              {/* Breadcrumb + label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: theme.textMuted }}>
                  <span style={{ color: axis.accent, fontWeight: 600 }}>{item.subName}</span>
                  {item.groupName !== "general" && <span>{" \u203A "}{item.groupName}</span>}
                </div>
                <span style={{ fontSize: 13, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: item.f.label }} />
              </div>
              {/* Tags */}
              <TagArea
                feature={item.f}
                sub={item.sub}
                group={item.group}
                tags={tags}
                theme={theme}
                dark={dark}
                dispatch={(action: ReducerAction) => dispatch(item.tabIndex, action)}
                removeTagGlobal={removeTagGlobal}
                setTags={setTags}
                isMobile={false}
              />
              {/* Macro */}
              <button
                onClick={() => dispatch(item.tabIndex, {
                  type: "UF", subId: item.sub.id, gId: item.group.id,
                  fId: item.f.id, field: "macro", val: nextMacro(item.f.macro)
                })}
                style={badgeStyle(macroBadge)}
              >
                <span style={{ fontSize: 10 }}>{(macroStatuses as any)[item.f.macro]?.icon}</span>
                {(macroStatuses as any)[item.f.macro]?.label}
              </button>
              {/* Micro */}
              <button
                onClick={() => dispatch(item.tabIndex, {
                  type: "UF", subId: item.sub.id, gId: item.group.id,
                  fId: item.f.id, field: "micro", val: nextMicro(item.f.micro)
                })}
                style={badgeStyle(microBadge)}
              >
                <span style={{ fontSize: 10 }}>{(microStatuses as any)[item.f.micro]?.icon}</span>
                {(microStatuses as any)[item.f.micro]?.label}
              </button>
            </div>
            {showNote && (
              <div style={{
                padding: "8px 16px 12px 62px",
                background: theme.noteBg, borderTop: "1px solid " + theme.noteBorder,
                borderRadius: "0 0 10px 10px",
              }}>
                <span style={{ fontSize: 12, color: theme.noteText, lineHeight: 1.7 }}>{item.f.note}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mobile All Toolbar ───────────────────────────────────────
function MobileAllToolbar({ ctrl, theme, search, setSearch, macroFilter, setMacroFilter,
  microFilter, setMicroFilter, tagFilter, setTagFilter, tags, showNotes, setShowNotes }: any) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...ctrl, flex: 1, minWidth: 0, cursor: "text" }} />
        <button onClick={() => setFiltersOpen(!filtersOpen)} style={{
          ...ctrl,
          fontWeight: filtersOpen ? 600 : 400,
          flexShrink: 0,
        }}>
          {"\u2699"} Filtres
        </button>
      </div>
      {filtersOpen && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          <select value={macroFilter} onChange={e => setMacroFilter(e.target.value)} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
            <option value="all">Macro</option>
            {Object.entries(macroStatuses).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={microFilter} onChange={e => setMicroFilter(e.target.value)} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
            <option value="all">Micro</option>
            {Object.entries(microStatuses).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ ...ctrl, flex: "1 1 calc(50% - 3px)" }}>
            <option value="all">Tag</option>
            {tags.map((t: Tag) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button onClick={() => setShowNotes(!showNotes)} style={{
            ...ctrl, flex: "1 1 calc(50% - 3px)",
            background: showNotes ? "#e6faf4" : theme.surface,
            color: showNotes ? "#005540" : theme.text,
            borderColor: showNotes ? "#00c48c" : theme.border,
            fontWeight: showNotes ? 600 : 400,
          }}>
            {"\uD83D\uDCDD"} Notes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────
function ModalBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed" as const, inset: 0, zIndex: 10000,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      {children}
    </div>
  );
}

function ConfirmDeleteModal({ theme, label, onCancel, onConfirm, isMobile, title }: any) {
  return (
    <ModalBackdrop>
      <div style={{
        background: theme.surface, borderRadius: 14, width: isMobile ? "100%" : 360, maxWidth: 360, padding: isMobile ? 20 : 24,
        boxShadow: theme.shadowMd, fontFamily: "Lexend, sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8 }}>{title ?? "Supprimer cette feature ?"}</div>
        <div style={{ fontSize: 12, color: theme.textSub, marginBottom: 20 }} dangerouslySetInnerHTML={{ __html: label }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid " + theme.border,
            background: theme.surface, fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: theme.text, cursor: "pointer",
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#E24B4A", fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: "#ffffff", cursor: "pointer", fontWeight: 600,
          }}>Supprimer</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function NewBesoinModal({ theme, onCancel, onAdd, isMobile }: any) {
  const [name, setName] = useState("");
  return (
    <ModalBackdrop>
      <div style={{
        background: theme.surface, borderRadius: 14, width: isMobile ? "100%" : 360, maxWidth: 360, padding: isMobile ? 20 : 24,
        boxShadow: theme.shadowMd, fontFamily: "Lexend, sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 12 }}>Nouveau besoin utilisateur</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) onAdd(name.trim()); }}
          autoFocus
          placeholder="Nom du besoin"
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: "1px solid " + theme.border, background: theme.surfaceAlt,
            fontSize: 13, fontFamily: "Lexend, sans-serif", color: theme.text,
            outline: "none", marginBottom: 16, boxSizing: "border-box" as const,
          }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid " + theme.border,
            background: theme.surface, fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: theme.text, cursor: "pointer",
          }}>Annuler</button>
          <button onClick={() => name.trim() && onAdd(name.trim())} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#00c48c", fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: "#003d2e", cursor: "pointer", fontWeight: 600,
          }}>Ajouter</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function ExportModal({ theme, csv, onClose, isMobile }: any) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <ModalBackdrop>
      <div style={{
        background: theme.surface, borderRadius: 14, width: isMobile ? "100%" : 500, maxWidth: 500, padding: isMobile ? 16 : 24,
        boxShadow: theme.shadowMd, fontFamily: "Lexend, sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 12 }}>Export CSV</div>
        <textarea
          ref={ref}
          readOnly
          value={csv}
          onClick={() => ref.current?.select()}
          style={{
            width: "100%", height: isMobile ? 160 : 220, fontFamily: "monospace", fontSize: 11,
            padding: 10, borderRadius: 8, border: "1px solid " + theme.border,
            background: theme.surfaceAlt, color: theme.text, outline: "none",
            resize: "none" as const, boxSizing: "border-box" as const,
          }}
        />
        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, marginBottom: 12 }}>
          Click the area then Ctrl+C to copy
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid " + theme.border,
            background: theme.surface, fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: theme.text, cursor: "pointer",
          }}>Close</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function ImportModal({ theme, onCancel, onImport, isMobile }: any) {
  const [csv, setCsv] = useState("");
  const [error, setError] = useState("");
  return (
    <ModalBackdrop>
      <div style={{
        background: theme.surface, borderRadius: 14, width: isMobile ? "100%" : 500, maxWidth: 500, padding: isMobile ? 16 : 24,
        boxShadow: theme.shadowMd, fontFamily: "Lexend, sans-serif",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 12 }}>Import CSV</div>
        <textarea
          value={csv}
          onChange={e => { setCsv(e.target.value); setError(""); }}
          placeholder="Paste CSV content here..."
          style={{
            width: "100%", height: isMobile ? 160 : 220, fontFamily: "monospace", fontSize: 11,
            padding: 10, borderRadius: 8, border: "1px solid " + theme.border,
            background: theme.surfaceAlt, color: theme.text, outline: "none",
            resize: "none" as const, boxSizing: "border-box" as const,
          }}
        />
        {error && <div style={{ fontSize: 11, color: "#e24b4a", marginTop: 4 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onCancel} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid " + theme.border,
            background: theme.surface, fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: theme.text, cursor: "pointer",
          }}>Annuler</button>
          <button onClick={() => {
            try { onImport(csv); } catch { setError("Failed to parse CSV"); }
          }} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "#00c48c", fontSize: 12, fontFamily: "Lexend, sans-serif",
            color: "#003d2e", cursor: "pointer", fontWeight: 600,
          }}>Importer</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
