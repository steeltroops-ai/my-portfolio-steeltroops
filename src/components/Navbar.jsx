import logo from '../assets/mps.png';
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedinIn } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { FiInstagram } from "react-icons/fi";


const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-6 mb-20">
      <div className="flex items-center flex-shrink-0">
        <img className="w-16 mx-4" src={logo} alt="logo"/>
      </div>
      <div className="flex justify-center gap-4 m-6 text-2xl ems-center">
        <a href='https://x.com/steeltroops_ai' target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-cyan-300">
          <FaXTwitter />
        </a>
        <a href='https://github.com/steeltroops-ai' target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-cyan-300">
          <FiGithub />
        </a>
        <a href='https://instagram.com/steeltroops_ai' target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-cyan-300">
          <FiInstagram />
        </a>
        <a href='https://linkedin.com/in/steeltroops-ai' target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-cyan-300">
          <FaLinkedinIn />
        </a>
        <a href='https://bento.me/steeltroops' target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-cyan-300">
          <AiOutlineLink />
        </a>
        </div>
    </nav>
  );
};

export default Navbar;