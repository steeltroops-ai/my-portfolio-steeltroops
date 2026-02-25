import { useState, useEffect } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiMoreHorizontal,
  FiAlignLeft,
  FiCode,
  FiGrid,
  FiList,
  FiTv,
  FiType,
} from "react-icons/fi";

const SECTION_TYPES = [
  {
    id: "prose",
    label: "Standard Prose",
    icon: FiAlignLeft,
    elements: ["bullet_points", "callout_note", "callout_warning"],
  },
  {
    id: "technical",
    label: "Technical Deep-Dive",
    icon: FiCode,
    elements: [
      "code_block",
      "bullet_points",
      "table",
      "callout_note",
      "callout_warning",
    ],
  },
  {
    id: "comparison_table",
    label: "Comparison Table",
    icon: FiGrid,
    elements: ["table", "bullet_points"],
  },
  {
    id: "code_walkthrough",
    label: "Code Walkthrough",
    icon: FiTv,
    elements: ["code_block", "callout_tip", "callout_warning"],
  },
  {
    id: "case_study",
    label: "Case Study",
    icon: FiType,
    elements: ["ai_insight", "code_block", "table"],
  },
];

const SectionConfigurator = ({
  section,
  onChange,
  onDelete,
  onDuplicate,
  isEditing,
  setEditing,
}) => {
  const [localSection, setLocalSection] = useState(section);

  useEffect(() => {
    setLocalSection(section);
  }, [section]);

  const handleUpdate = (updates) => {
    const updated = { ...localSection, ...updates };
    setLocalSection(updated);
    onChange(updated);
  };

  const currentType =
    SECTION_TYPES.find((t) => t.id === localSection.type) || SECTION_TYPES[0];

  if (!isEditing) {
    return (
      <div className="group relative border border-white/5 bg-transparent hover:bg-white/5 rounded-2xl p-4 transition-all duration-500 cubic-bezier-[0.4,0,0.2,1]">
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4 overflow-hidden">
            <div
              className={`p-2.5 rounded-xl bg-white/5 border border-white/5 text-neutral-400 shrink-0 transition-transform group-hover:scale-110`}
            >
              <currentType.icon size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-white text-[10px] uppercase tracking-wider truncate pr-2 group-hover:text-cyan-400 transition-colors">
                {localSection.heading || (
                  <span className="italic text-neutral-500">
                    Untitled_Section
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-3 text-[9px] text-neutral-500 font-mono mt-1 uppercase tracking-widest">
                <span>{currentType.label}</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span>~{localSection.targetWords} WORDS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Edit Section"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={onDuplicate}
              className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Duplicate"
            >
              <FiPlus size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-purple-500/20 bg-purple-500/5 rounded-xl p-5 shadow-lg backdrop-blur-sm transition-all animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-4">
        {/* Header: Title & Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1.5 block">
              Section Heading
            </label>
            <input
              type="text"
              value={localSection.heading}
              onChange={(e) => handleUpdate({ heading: e.target.value })}
              placeholder="e.g. Architecture Overview"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/50 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1.5 block">
              Content Type
            </label>
            <div className="relative">
              <select
                value={localSection.type}
                onChange={(e) => handleUpdate({ type: e.target.value })}
                className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
              >
                {SECTION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                <FiMoreHorizontal />
              </div>
            </div>
          </div>
        </div>

        {/* Configuration: Length & Subsections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Target Length Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                Target Length
              </label>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                ~{localSection.targetWords} words
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1200"
              step="50"
              value={localSection.targetWords}
              onChange={(e) =>
                handleUpdate({ targetWords: parseInt(e.target.value) })
              }
              className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 mt-1 uppercase tracking-wide font-medium">
              <span>Short</span>
              <span>Medium</span>
              <span>Long</span>
              <span>Deep Dive</span>
            </div>
          </div>

          {/* Subsections Counter */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                Subsections (H3)
              </label>
              <span className="text-xs font-mono text-neutral-300 bg-white/5 px-1.5 py-0.5 rounded">
                {localSection.subsections || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleUpdate({ subsections: num })}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    (localSection.subsections || 0) === num
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Elements Selection */}
        <div className="pt-2">
          <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-2 block">
            Included Elements
          </label>
          <div className="flex flex-wrap gap-2">
            {currentType.elements.map((elem) => {
              const isSelected = (localSection.includeElements || []).includes(
                elem
              );
              const label = elem
                .replace(/_/g, " ")
                .replace("callout", "")
                .trim(); // simple clean up

              return (
                <button
                  key={elem}
                  onClick={() => {
                    const current = localSection.includeElements || [];
                    const next = isSelected
                      ? current.filter((e) => e !== elem)
                      : [...current, elem];
                    handleUpdate({ includeElements: next });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {isSelected && <FiCheck size={10} />}
                  <span className="capitalize">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-white/5 mt-2">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionConfigurator;
