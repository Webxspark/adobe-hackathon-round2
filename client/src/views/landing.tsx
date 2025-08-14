import Layout from "@/layout.tsx";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const Landing = () => {
    return (
        <Layout>
            <div className="bg-[#020617] min-h-screen p-4 h-screen">
                <div className="m-4">
                    <div className="font-bold font-inter text-3xl p-3">My Books</div>
                    <div className="flex w-full gap-2">
                        <div>
                            {/* <Card className="m-4 bg-[#1e293b]">
                                <div className="flex flex-col justify-between h-full">
                                    <CardContent className="flex items-center justify-center h-full">
                                        Book Cover
                                    </CardContent>
                                    <CardHeader>
                                        <CardTitle>Book Title</CardTitle>
                                        <CardDescription>Author Name</CardDescription>
                                    </CardHeader>
                                </div>
                            </Card> */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    <Card className="bg-[#1e293b] border-gray-600 w-full">
                                        <div className="flex flex-col h-full">
                                            <CardContent className="flex-1 flex items-center justify-center p-4">
                                                <div className="w-full h-full p-1 bg-[#374151] rounded-md flex items-center justify-center text-gray-400 text-sm">
                                                    Book Cover
                                                </div>
                                            </CardContent>
                                            <CardHeader className="px-4">
                                                <CardTitle className="text-white text-lg font-semibold">
                                                    Title
                                                </CardTitle>
                                                <CardDescription className="text-gray-400 text-sm">
                                                    Author
                                                </CardDescription>
                                            </CardHeader>
                                        </div>
                                    </Card>
                            </div>
                        </div>
                        {/* <div>
                            <Card className="m-4 bg-[#1e293b]">
                                <div className="flex flex-col justify-between h-full">
                                    <CardContent className="flex items-center justify-center h-full">
                                        Book Cover
                                    </CardContent>
                                    <CardHeader>
                                        <CardTitle>Book Title</CardTitle>
                                        <CardDescription>Author Name</CardDescription>
                                    </CardHeader>
                                </div>
                            </Card>
                        </div> */}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Landing;