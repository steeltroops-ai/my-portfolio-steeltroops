/**
 * useAIGenerator Hook
 *
 * Client-orchestrated AI blog generation pipeline.
 * Manages multi-step generation with progress tracking and autosave.
 */

import { useState, useCallback, useRef } from "react";

const API_BASE = "/api";

// Generation states
export const GENERATION_STATUS = {
  IDLE: "idle",
  PLANNING: "planning", // Generating outline
  WRITING: "writing", // Generating sections
  ENRICHING: "enriching", // Generating metadata
  COMPLETE: "complete",
  ERROR: "error",
};

/**
 * AI Blog Generation Hook
 *
 * @param {Object} options
 * @param {Function} options.onProgress - Callback for progress updates
 * @param {Function} options.onSectionComplete - Callback when a section is done
 * @param {Function} options.onAutosave - Callback to autosave progress
 */
export function useAIGenerator({
  onProgress,
  onSectionComplete,
  onAutosave,
} = {}) {
  const [status, setStatus] = useState(GENERATION_STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const abortControllerRef = useRef(null);

  /**
   * Reset the generator state
   */
  const reset = useCallback(() => {
    setStatus(GENERATION_STATUS.IDLE);
    setProgress(0);
    setCurrentStep("");
    setError(null);
    setResult(null);
  }, []);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus(GENERATION_STATUS.IDLE);
    setCurrentStep("Cancelled");
  }, []);

  /**
   * Make API request with error handling
   */
  const apiRequest = async (endpoint, body) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: abortControllerRef.current?.signal,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.details || "API request failed");
    }

    return data;
  };

  /**
   * Generate a blog post using the multi-step pipeline
   *
   * @param {Object} params
   * @param {string} params.topic - The blog topic
   * @param {string} params.style - Writing style (technical, casual, tutorial, opinion, storytelling)
   * @param {string} params.length - Target length (short, medium, long, comprehensive)
   * @param {string[]} params.tags - Optional initial tags
   */
  const generate = useCallback(
    async ({ topic, style = "technical", length = "medium", tags = [] }) => {
      // Reset state
      reset();
      setStatus(GENERATION_STATUS.PLANNING);
      abortControllerRef.current = new AbortController();

      const startTime = Date.now();

      try {
        // ========================================
        // STEP 1: Generate Outline
        // ========================================
        setCurrentStep("Generating outline...");
        setProgress(10);
        onProgress?.({
          step: "outline",
          progress: 10,
          message: "Planning blog structure...",
        });

        const outlineResult = await apiRequest("/ai/generate-outline", {
          topic,
          style,
          length,
        });

        const { title, description, sections, suggested_tags } =
          outlineResult.data;
        setProgress(20);
        onProgress?.({
          step: "outline",
          progress: 20,
          message: `Outline ready: ${sections.length} sections`,
        });

        // ========================================
        // STEP 2: Generate Sections
        // ========================================
        setStatus(GENERATION_STATUS.WRITING);

        let fullContent = `# ${title}\n\n`;
        const totalSections = sections.length;

        for (let i = 0; i < totalSections; i++) {
          const section = sections[i];
          const sectionProgress = 20 + Math.floor((i / totalSections) * 60);

          setCurrentStep(`Writing: ${section.heading}`);
          setProgress(sectionProgress);
          onProgress?.({
            step: "section",
            progress: sectionProgress,
            message: `Writing section ${i + 1}/${totalSections}: ${section.heading}`,
            section_index: i,
          });

          const sectionResult = await apiRequest("/ai/generate-section", {
            title,
            topic,
            style,
            section,
            previous_content: fullContent,
            section_index: i,
            total_sections: totalSections,
          });

          // Append section content
          fullContent += sectionResult.data.content + "\n\n";

          // Callback for section completion
          onSectionComplete?.({
            section_index: i,
            heading: section.heading,
            content: sectionResult.data.content,
            word_count: sectionResult.data.word_count,
          });

          // Autosave after each section
          if (onAutosave && i < totalSections - 1) {
            onAutosave({
              title,
              content: fullContent,
              tags: suggested_tags,
              status: "draft",
              generation_status: "writing",
            });
          }
        }

        setProgress(80);

        // ========================================
        // STEP 3: Enrich with Metadata
        // ========================================
        setStatus(GENERATION_STATUS.ENRICHING);
        setCurrentStep("Generating SEO metadata...");
        onProgress?.({
          step: "enrich",
          progress: 85,
          message: "Optimizing for SEO...",
        });

        const enrichResult = await apiRequest("/ai/enrich", {
          title,
          content: fullContent,
          tags: tags.length > 0 ? tags : suggested_tags,
        });

        setProgress(95);

        // ========================================
        // COMPLETE
        // ========================================
        const totalTime = Date.now() - startTime;

        const finalResult = {
          title,
          content: fullContent,
          ...enrichResult.data,
          generation_time_ms: totalTime,
          sections: sections.map((s) => s.heading),
          outline: sections,
        };

        setResult(finalResult);
        setStatus(GENERATION_STATUS.COMPLETE);
        setProgress(100);
        setCurrentStep("Generation complete!");
        onProgress?.({
          step: "complete",
          progress: 100,
          message: "Blog post ready!",
        });

        return finalResult;
      } catch (err) {
        if (err.name === "AbortError") {
          setError("Generation cancelled");
          setStatus(GENERATION_STATUS.IDLE);
        } else {
          console.error("[AI Generator] Error:", err);
          setError(err.message);
          setStatus(GENERATION_STATUS.ERROR);
          onProgress?.({ step: "error", progress, message: err.message });
        }
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [reset, onProgress, onSectionComplete, onAutosave]
  );

  return {
    // State
    status,
    progress,
    currentStep,
    error,
    result,

    // Computed
    isGenerating:
      status !== GENERATION_STATUS.IDLE &&
      status !== GENERATION_STATUS.COMPLETE &&
      status !== GENERATION_STATUS.ERROR,
    isComplete: status === GENERATION_STATUS.COMPLETE,
    isError: status === GENERATION_STATUS.ERROR,

    // Actions
    generate,
    cancel,
    reset,
  };
}

export default useAIGenerator;
