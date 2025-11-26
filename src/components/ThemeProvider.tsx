import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
};

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "mindcompanion-theme",
    ...props
}: ThemeProviderProps) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme={defaultTheme}
            storageKey={storageKey}
            enableSystem
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}

export { useTheme } from "next-themes";
