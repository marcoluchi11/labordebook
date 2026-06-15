import { useEffect, useState } from "react";

const BREAKPOINTS = {
  SM: 0,
  MD: 600,
  LG: 960,
  XL: 1200,
};

export const useResponsive = <T>(styles: T | { sm?: T; md?: T; lg?: T; xl?: T }): T | undefined => {
  const isResponsiveObject =
    styles !== null &&
    typeof styles === "object" &&
    !Array.isArray(styles) &&
    ("sm" in styles || "md" in styles || "lg" in styles || "xl" in styles);

  const [responsiveStyles, setResponsiveStyles] = useState<T | undefined>(
    isResponsiveObject ? undefined : (styles as T)
  );

  useEffect(() => {
    const getResponsive = (s: typeof styles): T | undefined => {
      if (isResponsiveObject) {
        const r = s as { sm?: T; md?: T; lg?: T; xl?: T };
        let current: T | undefined;
        if (r.sm !== undefined && window.innerWidth >= BREAKPOINTS.SM) current = r.sm;
        if (r.md !== undefined && window.innerWidth >= BREAKPOINTS.MD) current = r.md;
        if (r.lg !== undefined && window.innerWidth >= BREAKPOINTS.LG) current = r.lg;
        if (r.xl !== undefined && window.innerWidth >= BREAKPOINTS.XL) current = r.xl;
        return current;
      }
      return s as T;
    };

    const listener = () => setResponsiveStyles(getResponsive(styles));
    listener();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(styles)]);

  return responsiveStyles;
};
