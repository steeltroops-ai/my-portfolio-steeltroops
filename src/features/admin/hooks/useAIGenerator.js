/**
 * useAIGenerator Hook -- SSE Streaming Architecture
 *
 * Consumes the SSE stream from /api/ai/generate-blog-stream
 * and provides real-time progress tracking, section-by-section content,
 * and abort/cancel support.
 *
 * Replaces the old monolithic fetch + fake progress approach.
 */

import { useState, useCallback, useRef } from "react";

const API_BASE = "/api";

// Generation states
export const GENERATION_STATUS = {
  IDLE: "idle",
  PLANNING: "planning",
  WRITING: "writing",
  ENRICHING: "enriching",
  COMPLETE: "complete",
  ERROR: "error",
};

/**
 * AI Blog Generation Hook -- SSE Version
 *
 * @param {Object} options
 * @param {Function} options.onProgress - Callback for progress updates
 * @param {Function} options.onSectionComplete - Callback when a section finishes
 * @param {Function} options.onOutlineReady - Callback when outline is received
 * @param {Function} options.onChunk - Callback for each streaming chunk
 */
export function useAIGenerator({
  onProgress,
  onSectionComplete,
  onOutlineReady,
  onChunk,
} = {}) {
  const [status, setStatus] = useState(GENERATION_STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Streaming state
  const [outline, setOutline] = useState(null);
  const [sections, setSections] = useState([]);
  const [streamedContent, setStreamedContent] = useState("");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [metadata, setMetadata] = useState(null);

  const abortControllerRef = useRef(null);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setStatus(GENERATION_STATUS.IDLE);
    setProgress(0);
    setCurrentStep("");
    setError(null);
    setResult(null);
    setOutline(null);
    setSections([]);
    setStreamedContent("");
    setCurrentSectionIndex(-1);
    setMetadata(null);
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
   * Parse a single SSE event from raw text
   */
  const parseSSEEvent = (text) => {
    const lines = text.split("\n");
    let event = "";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.substring(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.substring(6).trim();
      }
    }

    if (!event || !data) return null;

    try {
      return { event, data: JSON.parse(data) };
    } catch {
      return { event, data: { raw: data } };
    }
  };

  /**
   * Generate a blog post using the SSE streaming pipeline
   *
   * @param {Object} params
   * @param {string} params.topic - The blog topic
   * @param {string} params.audience - Target audience
   * @param {Object} params.blueprint - Optional structural blueprint
   * @param {string} params.globalTone - Global tone selection
   * @param {string} params.toneModifier - Optional tone modifier
   * @param {string} params.codeLanguage - Preferred code language
   * @param {string} params.length - Target length
   * @param {string[]} params.tags - Optional initial tags
   *
   * Legacy params for backward compatibility:
   * @param {string} params.style -> maps to globalTone
   */
  const generate = useCallback(
    async ({
      topic,
      audience = "general",
      blueprint,
      globalTone,
      toneModifier,
      codeLanguage = "python",
      length = "medium",
      tags = [],
      // Legacy param mapping
      style,
    }) => {
      // Reset everything
      reset();
      setStatus(GENERATION_STATUS.PLANNING);
      abortControllerRef.current = new AbortController();

      const startTime = Date.now();

      // Map legacy "style" to globalTone if needed
      const resolvedTone = globalTone || style || "professional";

      // Map legacy style names to new tone names
      const toneMapping = {
        professional: "professional",
        casual: "conversational",
        technical: "analytical",
        storytelling: "narrative",
        contrarian: "contrarian",
      };

      const finalTone = toneMapping[resolvedTone.toLowerCase()] || resolvedTone;

      try {
        setCurrentStep("Connecting to AI engine...");
        setProgress(2);

        onProgress?.({
          step: "init",
          progress: 2,
          message: "Initializing generation stream...",
        });

        // ---------------------------------------------------------------
        // MAKE STREAMING REQUEST
        // ---------------------------------------------------------------
        const response = await fetch(`${API_BASE}/ai/generate-blog-stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            audience,
            blueprint,
            globalTone: finalTone,
            toneModifier,
            codeLanguage,
            length,
            tags,
            generateMetaSeparately: true,
            saveAsDraft: true,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // ---------------------------------------------------------------
        // READ SSE STREAM
        // ---------------------------------------------------------------
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let totalSections = 0;
        let completedCount = 0;
        let accumulatedContent = "";
        const completedSections = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on double newlines (SSE event boundary)
          const events = buffer.split("\n\n");
          // Keep the last incomplete event in the buffer
          buffer = events.pop() || "";

          for (const eventText of events) {
            if (!eventText.trim()) continue;

            const parsed = parseSSEEvent(eventText);
            if (!parsed) continue;

            const { event, data } = parsed;

            switch (event) {
              case "generation_started":
                totalSections =
                  typeof data.totalSections === "number"
                    ? data.totalSections
                    : 6;
                setCurrentStep("Architecting the narrative...");
                setProgress(5);
                onProgress?.({
                  step: "started",
                  progress: 5,
                  message: `Planning ${totalSections} sections...`,
                });
                break;

              case "outline_complete":
                setOutline(data);
                totalSections = data.sections.length;
                setStatus(GENERATION_STATUS.WRITING);
                setCurrentStep(`Outline ready: "${data.title}"`);
                setProgress(10);
                onOutlineReady?.(data);
                onProgress?.({
                  step: "outline",
                  progress: 10,
                  message: `Blueprint: ${totalSections} sections planned`,
                });
                break;

              case "section_started":
                setCurrentSectionIndex(data.index);
                setCurrentStep(
                  `Writing: "${data.heading}" (${data.index + 1}/${totalSections})`
                );
                break;

              case "section_chunk":
                accumulatedContent += data.chunk;
                setStreamedContent(accumulatedContent);
                onChunk?.(data);
                break;

              case "section_complete": {
                completedCount++;
                completedSections.push({
                  index: data.index,
                  heading: data.heading,
                  wordCount: data.wordCount,
                });
                setSections([...completedSections]);

                // Progress: outline=10%, sections=10-85%, metadata=85-95%, done=100%
                const sectionProgress =
                  10 + (completedCount / totalSections) * 75;
                setProgress(Math.round(sectionProgress));
                setCurrentStep(
                  `Completed: "${data.heading}" (${data.wordCount} words)`
                );
                onSectionComplete?.(data);
                onProgress?.({
                  step: "section_complete",
                  progress: Math.round(sectionProgress),
                  message: `Section ${completedCount}/${totalSections} done`,
                  data,
                });
                break;
              }

              case "metadata_complete":
                setMetadata(data);
                setStatus(GENERATION_STATUS.ENRICHING);
                setProgress(90);
                setCurrentStep("Finalizing metadata...");
                onProgress?.({
                  step: "metadata",
                  progress: 90,
                  message: "Tags and SEO metadata generated",
                });
                break;

              case "generation_complete": {
                const finalResult = {
                  id: data.postId,
                  title: data.title,
                  slug: data.slug,
                  content: accumulatedContent,
                  totalWords: data.totalWords,
                  readTime: data.readTime,
                  timeMs: data.timeMs,
                  saved: true,
                  sections: completedSections,
                  generation_time_ms: Date.now() - startTime,
                };

                setResult(finalResult);
                setStatus(GENERATION_STATUS.COMPLETE);
                setProgress(100);
                setCurrentStep("Generation complete!");
                onProgress?.({
                  step: "complete",
                  progress: 100,
                  message: `Blog post ready! ${data.totalWords} words in ${Math.round(data.timeMs / 1000)}s`,
                });
                break;
              }

              case "error":
                throw new Error(
                  `${data.stage} error${data.index !== null ? ` (section ${data.index + 1})` : ""}: ${data.message}${data.partialSaved ? " (partial draft saved)" : ""}`
                );
            }
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          setError("Generation cancelled");
          setStatus(GENERATION_STATUS.IDLE);
        } else {
          console.error("[AI Generator] Error:", err);
          setError(err.message);
          setStatus(GENERATION_STATUS.ERROR);
          onProgress?.({ step: "error", progress: 0, message: err.message });
        }
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [reset, onProgress, onSectionComplete, onOutlineReady, onChunk]
  );

  return {
    // Core state
    status,
    progress,
    currentStep,
    error,
    result,

    // Streaming state
    outline,
    sections,
    streamedContent,
    currentSectionIndex,
    metadata,

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
