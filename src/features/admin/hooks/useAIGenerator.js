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
      setStatus(GENERATION_STATUS.PLANNING); // Initial state
      abortControllerRef.current = new AbortController();

      const startTime = Date.now();

      try {
        // Start simulated progress for the monolithic generation
        setCurrentStep("Architecting the narrative (Mayank OS)...");
        setProgress(10);

        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + 5;
          });
        }, 800);

        onProgress?.({
          step: "init",
          progress: 10,
          message: "Initializing Mayank OS engine...",
        });

        // Call the single monolithic endpoint
        const apiResponse = await apiRequest("/ai/generate-blog", {
          topic,
          style,
          length,
          tags,
          saveAsDraft: true,
        });

        clearInterval(progressInterval);

        const data = apiResponse.data;

        // Construct final result matching the shape expected by UI
        const finalResult = {
          ...data,
          generation_time_ms: Date.now() - startTime,
          sections: [], // Monolithic generation doesn't return granular sections list in same way, but that's fine
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
          onProgress?.({ step: "error", progress: 0, message: err.message });
        }
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [reset, onProgress]
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
