import {BookOpen} from "lucide-react";
import {Link} from "react-router-dom";
import {ROUTES} from "@/constants/routes.ts";
import {Button} from "@/components/ui/button.tsx";

const Navbar = () => {
    return (
        <header className={'w-full bg-[#b08463] text-white px-8 py-6 flex items-center justify-between shadow-lg z-10'}>
            <Link to={ROUTES.landing} className="flex items-center gap-4">
                <BookOpen size={24} className="" />
                <h1 className="font-bold font-inter">App Name</h1>
            </Link>
            <div>
                <Button>
                    Upload
                </Button>
            </div>
        </header>
    );
};

export default Navbar;