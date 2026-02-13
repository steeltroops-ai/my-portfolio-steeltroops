import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiCpu,
  FiLayers,
  FiMinimize2,
  FiMaximize2,
} from "react-icons/fi";
import SectionConfigurator from "./SectionConfigurator";

const DEFAULT_SECTION = {
  heading: "",
  type: "prose",
  targetWords: 400,
  subsections: 0,
  includeElements: [],
};

const BlueprintBuilder = ({ sections, onSectionsChange }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Initialize with at least one section if empty
  useEffect(() => {
    if (!sections || sections.length === 0) {
      onSectionsChange([structuredClone(DEFAULT_SECTION)]);
    }
  }, []);

  const addSection = (index = null) => {
    const newSection = structuredClone(DEFAULT_SECTION);
    const newSections = [...(sections || [])];

    if (index !== null) {
      newSections.splice(index + 1, 0, newSection);
    } else {
      newSections.push(newSection);
    }

    onSectionsChange(newSections);
    setEditingIndex(index !== null ? index + 1 : newSections.length - 1);
  };

  const updateSection = (index, updates) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    onSectionsChange(newSections);
  };

  const removeSection = (index) => {
    if (sections.length <= 1) return; // Prevent deleting last section
    const newSections = sections.filter((_, i) => i !== index);
    onSectionsChange(newSections);
    if (editingIndex === index) setEditingIndex(null);
  };

  const moveSection = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === sections.length - 1) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + direction];
    newSections[index + direction] = temp;

    onSectionsChange(newSections);

    if (editingIndex === index) setEditingIndex(index + direction);
    else if (editingIndex === index + direction) setEditingIndex(index);
  };

  const duplicateSection = (index) => {
    const newSection = structuredClone(sections[index]);
    const newSections = [...sections];
    newSections.splice(index + 1, 0, newSection);
    onSectionsChange(newSections);
  };

  const totalWords =
    sections?.reduce((acc, s) => acc + (s.targetWords || 0), 0) || 0;
  const estimatedReadTime = Math.ceil(totalWords / 200);

  return (
    <div className="w-full bg-black/20 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-300 rounded-lg">
            <FiLayers />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              Structure Blueprint
            </h3>
            <p className="text-xs text-neutral-500">
              {sections?.length} sections • ~{totalWords} words •{" "}
              {estimatedReadTime} min read
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-neutral-500 hover:text-white transition-colors"
        >
          {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {sections?.map((section, index) => (
                <div key={index} className="flex gap-2">
                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                    >
                      <FiArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      className="p-1.5 rounded hover:bg-white/10 text-neutral-500 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                    >
                      <FiArrowDown size={14} />
                    </button>
                  </div>

                  {/* Configurator */}
                  <div className="flex-1 min-w-0">
                    <SectionConfigurator
                      section={section}
                      isEditing={editingIndex === index}
                      setEditing={(isEditing) =>
                        setEditingIndex(isEditing ? index : null)
                      }
                      onChange={(updates) => updateSection(index, updates)}
                      onDelete={() => removeSection(index)}
                      onDuplicate={() => duplicateSection(index)}
                    />
                  </div>
                </div>
              ))}

              {/* Add Section Button */}
              <button
                onClick={() => addSection()}
                className="w-full py-3 rounded-xl border border-dashed border-white/10 text-neutral-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <FiPlus /> Add Section
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlueprintBuilder;
