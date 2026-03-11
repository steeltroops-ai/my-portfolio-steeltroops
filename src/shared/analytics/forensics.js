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

    // 2. Hardware & Locale Specs
    data.cpu_cores = navigator.hardwareConcurrency || 0;
    data.memory_estimate = navigator.deviceMemory || 0;
    data.max_touch_points = navigator.maxTouchPoints || 0;
    data.timezone_offset = new Date().getTimezoneOffset();
    try {
      data.timezone_name = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      data.timezone_name = "Unknown";
    }
    data.languages = navigator.languages
      ? navigator.languages.join(",")
      : navigator.language;
    data.platform = navigator.platform || "Unknown";

    // 3. Network Intelligence
    if (navigator.connection) {
      data.network_type = navigator.connection.effectiveType || "unknown";
      data.network_downlink = navigator.connection.downlink || 0;
      data.network_rtt = navigator.connection.rtt || 0;
      data.save_data = navigator.connection.saveData || false;
    }

    // 4. Audio Context Fingerprint (Oscillator Math)
    try {
      const AudioContext =
        window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext(1, 44100, 44100);
        const oscillator = audioCtx.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.value = 10000;

        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        oscillator.connect(compressor);
        compressor.connect(audioCtx.destination);
        oscillator.start(0);

        const renderedBuffer = await audioCtx.startRendering();
        const channelData = renderedBuffer.getChannelData(0);

        let audioHash = 0;
        for (let i = 4500; i < 5000; i++) {
          audioHash += Math.abs(channelData[i]);
        }
        data.audio_hash = audioHash.toString();
        data.audio_support = true;
      }
    } catch (e) {
      data.audio_support = false;
    }

    // 5. WebRTC Local IP Leak Extraction
    data.local_ips = await new Promise((resolve) => {
      const ips = [];
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => resolve([]));
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          resolve(ips);
          return;
        }
        const ipRegex =
          /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;
        const matches = event.candidate.candidate.match(ipRegex);
        if (matches) {
          matches.forEach((ip) => {
            if (!ips.includes(ip) && ip !== "0.0.0.0" && ip !== "127.0.0.1")
              ips.push(ip);
          });
        }
      };
      setTimeout(() => resolve(ips), 1000); // 1s timeout to prevent hanging
    });

    // 6. Canvas Fingerprint
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

    // 7. Precise Device Model (via UAParser + Heuristics fallback)
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
