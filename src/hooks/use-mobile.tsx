import * as React from "react";

// Breakpoints matching Tailwind defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

interface DeviceInfo {
  isMobile: boolean; // < 768px (md breakpoint)
  isTablet: boolean; // >= 768px && < 1024px
  isDesktop: boolean; // >= 1024px
  isSmallMobile: boolean; // < 640px (sm breakpoint)
  width: number;
  breakpoint: Breakpoint | "xs";
  // Touch detection
  hasTouch: boolean;
  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Enhanced mobile detection hook with breakpoint-specific detection
 * SSR-safe with hydration handling
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSmallMobile: false,
    width: 1024,
    breakpoint: "lg",
    hasTouch: false,
    isPortrait: true,
    isLandscape: false,
  });

  React.useEffect(() => {
    const getBreakpoint = (width: number): Breakpoint | "xs" => {
      if (width < BREAKPOINTS.sm) return "xs";
      if (width < BREAKPOINTS.md) return "sm";
      if (width < BREAKPOINTS.lg) return "md";
      if (width < BREAKPOINTS.xl) return "lg";
      if (width < BREAKPOINTS["2xl"]) return "xl";
      return "2xl";
    };

    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const hasTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0;

      setDeviceInfo({
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        isSmallMobile: width < BREAKPOINTS.sm,
        width,
        breakpoint: getBreakpoint(width),
        hasTouch,
        isPortrait: height > width,
        isLandscape: width > height,
      });
    };

    // Initial update
    updateDeviceInfo();

    // Listen for resize and orientation changes
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    // Use matchMedia for more efficient updates
    const mediaQuery = window.matchMedia(
      `(max-width: ${BREAKPOINTS.md - 1}px)`
    );
    mediaQuery.addEventListener("change", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
      mediaQuery.removeEventListener("change", updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

/**
 * Simple mobile check hook (backwards compatible)
 */
export function useIsMobile(): boolean {
  const { isMobile } = useDeviceDetection();
  return isMobile;
}

/**
 * Hook to check if we're on a touch device
 */
export function useHasTouch(): boolean {
  const { hasTouch } = useDeviceDetection();
  return hasTouch;
}

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint(): Breakpoint | "xs" {
  const { breakpoint } = useDeviceDetection();
  return breakpoint;
}

/**
 * Hook to check if viewport is at or above a certain breakpoint
 */
export function useMinBreakpoint(minBreakpoint: Breakpoint): boolean {
  const { width } = useDeviceDetection();
  return width >= BREAKPOINTS[minBreakpoint];
}

/**
 * Hook to check if viewport is below a certain breakpoint
 */
export function useMaxBreakpoint(maxBreakpoint: Breakpoint): boolean {
  const { width } = useDeviceDetection();
  return width < BREAKPOINTS[maxBreakpoint];
}

// Export breakpoints for use in components
export { BREAKPOINTS };

