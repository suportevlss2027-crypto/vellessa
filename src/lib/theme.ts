import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const themeInitScript = `(function(){try{var t=localStorage.getItem('vellessa-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("vellessa-theme", next);
    setTheme(next);
  };
  return { theme, toggle };
}
