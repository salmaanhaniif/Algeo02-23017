import DragandDrop from "@/components/draganddrop";
import Image from "next/image";

export default function Home() {
  return (
    <div className="absolute inset-0 flex items-center justify-center min-h-screen">
      {/* <h1 className="text-2xl">Hello World!</h1> */}
      <DragandDrop/>
    </div>
  );
}
