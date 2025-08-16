import { useEffect, useState } from "react";

import Layout from "@/layout.tsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

declare global {
    interface Window {
        AdobeDC: any;
    }
}

type Pdf = {
    title: string;
    author: string;
    url: string;
};

const Landing = () => {
    const [selectedPdf, setSelectedPdf] = useState<Pdf | null>(null);
    const CLIENT_ID = "b18cd9264a134d9285038d71b5e1bfc2"; 
  
    const pdfs = [
        { title: "The Great Gatsby", author: "F. Scott Fitzgerald", url: "https://hazidesaratcollege.ac.in/library/uploads/85jkr_harrypotter_1.pdf" },
        { title: "To Kill a Mockingbird", author: "Harper Lee", url: "https://vidyaprabodhinicollege.edu.in/VPCCECM/ebooks/ENGLISH%20LITERATURE/Harry%20potter/(Book%207)%20Harry%20Potter%20And%20The%20Deathly%20Hallows.pdf" },
        { title: "1984", author: "George Orwell" },
        { title: "Brave New World", author: "Aldous Huxley" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
        { title: "The Catcher in the Rye", author: "J.D. Salinger" },
    ];

    useEffect(() => {
        // Load Adobe PDF Embed API script
        const script = document.createElement('script');
        script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
        script.async = true;
        document.head.appendChild(script);

        return () => {
            // Cleanup
            document.head.removeChild(script);
        };
    }, []);

    const openPdfViewer = (pdf: any) => {
        setSelectedPdf(pdf);

        // Wait for Adobe SDK to be ready
        document.addEventListener("adobe_dc_view_sdk.ready", function () {
            const adobeDCView = new window.AdobeDC.View({
                clientId: "b18cd9264a134d9285038d71b5e1bfc2",
                divId: "adobe-dc-view"
            });

            adobeDCView.previewFile({
                content: { location: { url: pdf.url } },
                metaData: { fileName: pdf.title + ".pdf" }
            });
        });
    };

    const closePdfViewer = () => {
        setSelectedPdf(null);
        // Clear the PDF viewer
        const viewerDiv = document.getElementById("adobe-dc-view");
        if (viewerDiv) {
            viewerDiv.innerHTML = '';
        }
    };

    return (
        <Layout>
            <div className="bg-white min-h-screen p-6">
                <div className="font-bold font-inter text-3xl text-black mb-6">My PDFs</div>

                {/* PDF Grid - Hide when PDF is selected */}
                {!selectedPdf && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {pdfs.map((pdf, index) => (
                            <Card
                                key={index}
                                className="bg-white border-[#000] w-full max-w-[220px] h-[320px] cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => openPdfViewer(pdf)}
                            >
                                <div className="flex flex-col h-full">
                                    <CardContent className="flex-1 flex items-center justify-center p-4">
                                        <div className="w-full h-full bg-[#faf5fe] rounded-md flex items-center justify-center text-black text-sm">
                                            PDF Cover
                                        </div>
                                    </CardContent>
                                    <CardHeader>
                                        <CardTitle className="text-black text-lg font-semibold">
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
                )}

                {/* PDF Viewer */}
                {selectedPdf && (
                    <div className="fixed inset-0 bg-white z-50">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">{selectedPdf.title}</h2>
                            <button
                                onClick={closePdfViewer}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Close
                            </button>
                        </div>
                        <div id="adobe-dc-view" className="w-full h-full"></div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Landing;