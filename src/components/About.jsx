import aboutImg from "../assets/about.jpg";
import { ABOUT_TEXT } from "../constants";

const About = () => {
  return (
    <section className="pb-4 border-b border-neutral-900">
      <h2 className="my-20 text-4xl text-center">
        About
        <span className="text-neutral-500">Me</span>
      </h2>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:p-8">
          <div className="flex flex-col items-center justify-center lg:items-start">
            <img 
              className="h-auto max-w-full rounded-2xl" 
              src={aboutImg} 
              alt="about" 
              loading="lazy"
            />
          </div>
        </div>
        <div className="w-full lg:w-1/2">
          <div className="flex justify-center lg:justify-start">
            <p className="max-w-xl py-6 my-2 text-justify">{ABOUT_TEXT}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;