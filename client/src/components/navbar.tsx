import {BookOpen} from "lucide-react";
import {Link} from "react-router-dom";
import {ROUTES} from "@/constants/routes.ts";
import {Button} from "@/components/ui/button.tsx";

const Navbar = () => {
    return (
        <header className={'w-full bg-[#91b7fd] text-white px-8 py-6 flex items-center justify-between shadow-lg z-10'}>
            <Link to={ROUTES.landing} className="flex items-center gap-4">
                <BookOpen size={24} className="text-black" />
                <h1 className="font-bold font-inter text-black">App Name</h1>
            </Link>
            <div>
                <Button className="bg-[#e7efff] hover:bg-[#357ab8] transition-colors text-black">
                    Upload
                </Button>
            </div>
        </header>
    );
};

export default Navbar;