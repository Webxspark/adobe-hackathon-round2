import Layout from "@/layout.tsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const Landing = () => {

    const pdfs = [
        { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
        { title: "To Kill a Mockingbird", author: "Harper Lee" },
        { title: "1984", author: "George Orwell" },
        { title: "Brave New World", author: "Aldous Huxley" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
    ];

    return (
        <Layout>
            <div className="bg-[#b5a192] min-h-screen p-6">
                <div className="font-bold font-inter text-3xl text-black mb-6">My PDFs</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {pdfs.map((pdf, index) => (
                        <Card key={index} className="bg-[#b08463] border-[#000] w-full max-w-[220px] h-[320px]">
                            <div className="flex flex-col h-full">
                                <CardContent className="flex-1 flex items-center justify-center p-4">
                                    <div className="w-full h-full bg-[#d0b9a7] rounded-md flex items-center justify-center text-black text-sm">
                                        PDF Cover
                                    </div>
                                </CardContent>
                                <CardHeader>
                                    <CardTitle className="text-white text-lg font-semibold">
                                        {pdf.title}
                                    </CardTitle>
                                    <CardDescription className="text-gray-800 text-sm">
                                        {pdf.author}
                                    </CardDescription>
                                </CardHeader>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default Landing;