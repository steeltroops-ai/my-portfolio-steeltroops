import { RiReactjsLine } from "react-icons/ri";
import { TbBrandNextjs } from "react-icons/tb";
import { SiMongodb } from "react-icons/si";
import { FaNodeJs } from "react-icons/fa6";
import { SiPytorch } from "react-icons/si";
import { DiPython } from "react-icons/di";


const Technologies = () => {
  return (
    <div className="pb-24 border-b border-neutral-800">
      <h2 className="my-20 text-4xl text-center">Technologies</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="p-4 border-4 border-neutral-800 rounded-2xl">
          <RiReactjsLine className="text-7xl text-cyan-400" />          
        </div>
        <div className="p-4 border-4 border-neutral-800 rounded-2xl">
          <TbBrandNextjs className="text-7xl" />          
        </div>
        <div className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiMongodb className="text-green-500 text-7xl" />          
        </div>
        <div className="p-4 border-4 border-neutral-800 rounded-2xl">
          <FaNodeJs className="text-green-500 text-7xl" />          
        </div>
        <div className="p-4 border-4 border-neutral-800 rounded-2xl">
          <SiPytorch className="text-orange-400 text-7xl" />          
        </div>
        <div className="p-4 border-4 border-neutral-800 rounded-2xl">
          <DiPython className="text-7xl text-fuchsia-600" />          
        </div>
      </div>
      
    </div>
  )
}

export default Technologies;