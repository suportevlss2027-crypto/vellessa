import { useEffect, useState } from "react";

export type Theme = "dark";

export const themeInitScript = `(function(){try{document.documentElement.classList.add('dark');localStorage.setItem('vellessa-theme','dark');}catch(e){}})();`;

export function useTheme() {
  const [theme] = useState<Theme>("dark");
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("vellessa-theme", "dark");
  }, []);
  const toggle = () => {
    // Single signature luxury dark palette — fixed
  };
  return { theme, toggle };
}
