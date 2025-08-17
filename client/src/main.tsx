import {lazy, StrictMode, Suspense} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {ThemeProvider} from "@/components/theme-provider.tsx";
import ThemeSwitcher from "@/components/ui/theme-switcher.tsx";
import Preloader from "@/components/preloader.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";

const App = lazy(() => import("@/App"));

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider defaultTheme={'dark'} storageKey={'adobe-hackathon-theme'}>
            <Suspense
                fallback={<Preloader className={'h-[90dvh] flex items-center justify-center'}/>}
            >
                <App/>
            </Suspense>
            <Toaster
                position={'bottom-right'}
            />
            <ThemeSwitcher/>
        </ThemeProvider>
    </StrictMode>,
)
