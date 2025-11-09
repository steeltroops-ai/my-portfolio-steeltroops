import logo from "../assets/mps.png";
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { FiGithub, FiInstagram } from "react-icons/fi";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-3 sm:py-4 lg:py-6 mb-6 sm:mb-8 lg:mb-16">
      <div className="flex items-center flex-shrink-0">
        <img
          className="w-14 sm:w-16 md:w-20 lg:w-24 mx-0 -ml-2 sm:-ml-4 -mr-2 sm:-mr-4"
          src={logo}
          alt="logo"
          width="96"
          height="96"
        />
      </div>
      <div className="flex justify-center gap-2.5 sm:gap-3 md:gap-4 -mr-2 sm:-mr-4 text-lg sm:text-xl md:text-2xl items-center">
        <a
          href="https://x.com/steeltroops_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
          aria-label="Twitter (opens in new tab)"
        >
          <FaXTwitter />
        </a>
        <a
          href="https://github.com/steeltroops-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
          aria-label="GitHub (opens in new tab)"
        >
          <FiGithub />
        </a>
        <a
          href="https://instagram.com/steeltroops_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
          aria-label="Instagram (opens in new tab)"
        >
          <FiInstagram />
        </a>
        <a
          href="https://linkedin.com/in/steeltroops-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
          aria-label="LinkedIn (opens in new tab)"
        >
          <FaLinkedinIn />
        </a>
        <a
          href="https://bento.me/steeltroops"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
          aria-label="Bento profile (opens in new tab)"
        >
          <AiOutlineLink />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
