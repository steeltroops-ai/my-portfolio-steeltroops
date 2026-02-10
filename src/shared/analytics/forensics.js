import { UAParser } from "ua-parser-js";

/**
 * Forensic Data Extraction for Deep Tracking
 */

export const getForensicData = async () => {
  const data = {};

  try {
    // Parse User Agent with robust library
    const parser = new UAParser();
    const result = parser.getResult();

    // 1. GPU / Renderer Fingerprint
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      data.gpu_vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      data.gpu_renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    // 2. Hardware Specs
    data.cpu_cores = navigator.hardwareConcurrency || 0;
    data.memory_estimate = navigator.deviceMemory || 0;
    data.max_touch_points = navigator.maxTouchPoints || 0;
    data.timezone_offset = new Date().getTimezoneOffset();

    // 3. Network Guess
    if (navigator.connection) {
      data.network_type = navigator.connection.effectiveType || "unknown";
    }

    // 4. Canvas Fingerprint
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("SteelTroops_Forensics_Check", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("SteelTroops_Forensics_Check", 4, 17);
      data.canvas_hash = canvas.toDataURL();
    }

    // 5. Precise Device Model (via UAParser + Heuristics fallback)
    const vendor = result.device.vendor || "";
    const model = result.device.model || "";
    const type = result.device.type || "desktop";

    let deviceName = `${vendor} ${model}`.trim();

    // Fallback for desktops/unknowns using custom checks
    if (!deviceName || deviceName === "undefined undefined") {
      if (result.os.name === "iOS") {
        // iPhone Screen Height Heuristics
        const h = window.screen.height * (window.devicePixelRatio || 1);
        if (h === 2796 || h === 2778) deviceName = "iPhone 14/15 Pro Max";
        else if (h === 2556 || h === 2532) deviceName = "iPhone 14/15 Pro";
        else deviceName = "iPhone";
      } else if (result.os.name === "Mac OS") {
        deviceName = data.cpu_cores > 8 ? "Mac Pro / Studio" : "Macintosh";
      } else if (result.os.name === "Windows") {
        deviceName = "Windows PC";
      } else {
        deviceName = result.os.name || "Unknown System";
      }
    }

    data.device_model = deviceName;
    data.browser_details = `${result.browser.name} ${result.browser.version}`;
    data.os_details = `${result.os.name} ${result.os.version}`;
  } catch (e) {
    console.warn("[Forensics] Failed to extract deep metrics:", e);
  }

  return data;
};

// Removed custom guessDeviceModel as it's integrated above
const guessDeviceModel = () => {}; // No-op to satisfy potential references if any leftovers exist, though I'm removing the call.

// Simplified MurmurHash3 for fingerprinting
export const hashFingerprint = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};
