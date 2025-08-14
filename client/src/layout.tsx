import type {ReactNode} from "react";
import Navbar from "@/components/navbar.tsx";

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({children}: LayoutProps) => {
    return (
        <div>
            <Navbar />
            {children}
        </div>
    );
};

export default Layout;