import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {ThemeProvider} from "@/components/theme-provider.tsx";
import ThemeSwitcher from "@/components/ui/theme-switcher.tsx";
import {RouterProvider} from "react-router-dom";
import {ROUTER} from "@/config/router.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme={'dark'} storageKey={'adobe-hackathon-theme'}>
            <RouterProvider router={ROUTER}/>
            <ThemeSwitcher/>
        </ThemeProvider>
    </StrictMode>,
)
