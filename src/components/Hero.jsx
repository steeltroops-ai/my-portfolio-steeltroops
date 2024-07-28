import { HERO_CONTENT } from "../assets/constants";
import profilePic from "../assets/kevinRushProfile.png";

const Hero = () => {
  return (
    <div className="pb-4 border-b border-neutral-900 lg:mb-3">
        <div className="flex flex-wrap">
            <div className="w-full lg:w-1/2">
                <div className="flex flex-col items-center lg:items-start">
                    <h1 className="pb-16 text-6xl font-thin tracking-tight lg:mt-16 lg:text-8xl">
                        Mayank Pratap Singh                                               
                    </h1>
                    <span className="py-2 text-4xl tracking-tight text-transparent bg-gradient-to-r from-pink-300 via-slate-500 to-purple-500 bg-clip-text"> 
                        Full Stack Web Dev & <br/>
                        Machine Learning Engineer
                    </span>
                    <p className="max-w-xl py-6 my-2 font-light tracking-tight text-justify">
                        {HERO_CONTENT}
                    </p>
                </div>                
            </div>  
            <div className="w-full lg:w-1/2 lg:p-8">
                <div className="flex justify-center">
                    <img src={profilePic} alt="Mayank Pratap Singh" />
                </div>                
            </div>          
        </div>
    </div>
  )
}

export default Hero;