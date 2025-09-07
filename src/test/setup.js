import "@testing-library/jest-dom";

// Mock environment variables
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");
vi.stubEnv("VITE_ADMIN_EMAIL", "admin@test.com");

// Also mock import.meta.env for compatibility
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_SUPABASE_URL: "https://test.supabase.co",
    VITE_SUPABASE_ANON_KEY: "test-key",
    VITE_ADMIN_EMAIL: "admin@test.com",
    PROD: false,
    DEV: true,
    MODE: "test",
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock URL constructor
global.URL = class URL {
  constructor(url, _base) {
    this.href = url;
    this.origin = "https://test.com";
    this.pathname = "/test";
    this.searchParams = new URLSearchParams();
  }

  toString() {
    return this.href;
  }
};

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};

// Mock navigator
Object.defineProperty(navigator, "userAgent", {
  value: "Mozilla/5.0 (Test Browser)",
  writable: true,
});

Object.defineProperty(navigator, "connection", {
  value: {
    effectiveType: "4g",
    downlink: 10,
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
