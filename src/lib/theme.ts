import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const themeInitScript = `(function(){try{var t=localStorage.getItem('vellessa-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');if(!t)localStorage.setItem('vellessa-theme','dark');}}catch(e){}})();`;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    // Se já há preferência salva, respeitar; caso contrário, dark é o padrão
    const saved = localStorage.getItem("vellessa-theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      // Primeiro acesso: dark mode como padrão
      document.documentElement.classList.add("dark");
      localStorage.setItem("vellessa-theme", "dark");
      setTheme("dark");
    }
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("vellessa-theme", next);
    setTheme(next);
  };
  return { theme, toggle };
}
