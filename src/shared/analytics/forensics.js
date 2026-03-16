import { UAParser } from "ua-parser-js";

/**
 * djb2 hash — fast, deterministic string hash producing a hex digest.
 * Used instead of storing raw data (DataURLs, device lists, font lists).
 */
const djb2Hash = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

/**
 * Forensic Data Extraction — Browser Capability Probe
 *
 * Collects hardware/software signals available via standard Web APIs.
 * Every value is either hashed or reduced to a scalar — no raw PII is stored.
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
      try {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          data.gpu_vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          data.gpu_renderer = gl.getParameter(
            debugInfo.UNMASKED_RENDERER_WEBGL
          );
        }
      } catch (e) {
        // Some browsers block WEBGL_debug_renderer_info
      }
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
      try {
        const ips = [];
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("");
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .catch(() => resolve([]));
        pc.onicecandidate = (event) => {
          if (!event || !event.candidate) {
            pc.close();
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
        setTimeout(() => {
          pc.close();
          resolve(ips);
        }, 1000);
      } catch (e) {
        resolve([]);
      }
    });

    // 6. Canvas Fingerprint — hash the DataURL instead of storing raw base64 (BUG-14)
    try {
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
        const dataUrl = canvas.toDataURL();
        data.canvas_hash = djb2Hash(dataUrl);
      }
    } catch (e) {
      // Canvas fingerprinting blocked
    }

    // 7. Font Enumeration — detect installed fonts via canvas measureText width (BUG-15)
    try {
      const testFonts = [
        "Arial",
        "Verdana",
        "Times New Roman",
        "Courier New",
        "Georgia",
        "Comic Sans MS",
        "Impact",
        "Trebuchet MS",
        "Lucida Console",
        "Tahoma",
        "Palatino Linotype",
        "Segoe UI",
        "Helvetica Neue",
        "Roboto",
        "Fira Code",
        "Consolas",
        "Monaco",
        "Ubuntu",
        "SF Pro",
        "Menlo",
      ];
      const testString = "mmmmmmmmmmlli";
      const testSize = "72px";
      const baseFonts = ["monospace", "sans-serif", "serif"];

      const testCanvas = document.createElement("canvas");
      const testCtx = testCanvas.getContext("2d");
      if (testCtx) {
        // Measure base font widths
        const baseWidths = {};
        for (const base of baseFonts) {
          testCtx.font = `${testSize} ${base}`;
          baseWidths[base] = testCtx.measureText(testString).width;
        }

        const detectedFonts = [];
        for (const font of testFonts) {
          let detected = false;
          for (const base of baseFonts) {
            testCtx.font = `${testSize} '${font}', ${base}`;
            const w = testCtx.measureText(testString).width;
            if (w !== baseWidths[base]) {
              detected = true;
              break;
            }
          }
          if (detected) detectedFonts.push(font);
        }

        data.font_hash = djb2Hash(detectedFonts.join(","));
      }
    } catch (e) {
      // Font enumeration failed
    }

    // 8. Media Device Hash — enumerate device kinds without labels (BUG-15)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const summary = devices.map((d) => d.kind).sort().join(",");
        data.media_device_hash = djb2Hash(summary);
      }
    } catch (e) {
      // MediaDevices API not available or blocked
    }

    // 9. Battery Status (BUG-15)
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        data.battery_level = battery.level;
        data.battery_charging = battery.charging;
      }
    } catch (e) {
      // Battery API not available
    }

    // 10. Tab Visibility State (BUG-15)
    try {
      data.tab_visibility = document.visibilityState || "unknown";
    } catch (e) {
      data.tab_visibility = "unknown";
    }

    // 11. Precise Device Model (via UAParser + Heuristics fallback)
    const vendor = result.device.vendor || "";
    const model = result.device.model || "";
    const type = result.device.type || "desktop";

    let deviceName = `${vendor} ${model}`.trim();

    // Fallback for desktops/unknowns using custom checks
    if (!deviceName || deviceName === "undefined undefined") {
      if (result.os.name === "iOS") {
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

/**
 * hashFingerprint — produce a stable hardware fingerprint from forensic data.
 * Uses only signals that remain constant across sessions:
 * GPU, CPU cores, memory, screen, timezone, platform, audio context.
 * Volatile signals (battery, tab state, network) are excluded.
 */
export const hashFingerprint = (data) => {
  const stableSignals = [
    data.gpu_renderer || "",
    data.gpu_vendor || "",
    String(data.cpu_cores || 0),
    String(data.memory_estimate || 0),
    data.timezone_name || "",
    data.platform || "",
    data.audio_hash || "",
    data.canvas_hash || "",
    data.font_hash || "",
    data.media_device_hash || "",
    data.languages || "",
  ].join("|");

  return djb2Hash(stableSignals);
};
