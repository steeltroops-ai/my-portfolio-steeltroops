import logo from '../assets/kevinRushLogo.png';
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedinIn } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { FiInstagram } from "react-icons/fi";


const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-6 mb-20">
      <div className="flex items-center flex-shrink-0">
        <img className="w-10 mx-2" src={logo} alt="logo"/>
      </div>
      <div className="flex justify-center gap-4 m-8 text-2xl ems-center">
        <FaXTwitter className="cursor-pointer hover:text-cyan-300" />        
        <FiGithub className="cursor-pointer hover:text-cyan-300" />
        <FiInstagram className="cursor-pointer hover:text-cyan-300" />
        <FaLinkedinIn className="cursor-pointer hover:text-cyan-300" />
        <AiOutlineLink RxLinkNone2  className="cursor-pointer hover:text-cyan-300" />
      </div>
    </nav>
  );
};

export default Navbar;