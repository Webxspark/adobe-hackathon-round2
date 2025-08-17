// import {useAppContext} from "@/contexts/app.ts";
// import {useEffect} from "react";
//
// const Keybinds = () => {
//     const {nextTab, previousTab} = useAppContext();
//
//     useEffect(() => {
//         const shortcutInit = (event: KeyboardEvent) => {
//             console.log("keybinds", event);
//             if (event.ctrlKey && event.key === "ArrowRight") {
//                 event.preventDefault();
//                 event.stopPropagation();
//                 // alert("hi")
//                 if (event.shiftKey) {
//                     previousTab();
//                 } else {
//                     nextTab();
//                 }
//             }
//         };
//
//         document.addEventListener("keyup", shortcutInit);
//
//         return () => {
//             document.removeEventListener("keyup", shortcutInit);
//         };
//     }, [nextTab, previousTab]);
//     return null;
// };
//

const Keybinds = () => null;
export default Keybinds;
