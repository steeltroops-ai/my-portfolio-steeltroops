import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { FiGithub, FiInstagram } from "react-icons/fi";
import PropTypes from "prop-types";
import { SOCIALS } from "@/constants";

const socialLinks = [
  {
    href: SOCIALS.twitter,
    icon: FaXTwitter,
    label: "Twitter (opens in new tab)",
  },
  {
    href: SOCIALS.github,
    icon: FiGithub,
    label: "GitHub (opens in new tab)",
  },
  {
    href: SOCIALS.instagram,
    icon: FiInstagram,
    label: "Instagram (opens in new tab)",
  },
  {
    href: SOCIALS.linkedin,
    icon: FaLinkedinIn,
    label: "LinkedIn (opens in new tab)",
  },
  {
    href: SOCIALS.bento,
    icon: AiOutlineLink,
    label: "Bento profile (opens in new tab)",
  },
];

const SocialLinks = ({ className = "", iconClassName = "" }) => {
  return (
    <div
      className={`flex justify-center gap-2.5 sm:gap-3 md:gap-4 text-lg sm:text-xl md:text-2xl items-center ${className}`}
    >
      {socialLinks.map(({ href, icon: Icon, label }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`cursor-pointer hover:text-cyan-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black rounded-sm ${iconClassName}`}
          aria-label={label}
        >
          <Icon />
        </a>
      ))}
    </div>
  );
};

SocialLinks.propTypes = {
  className: PropTypes.string,
  iconClassName: PropTypes.string,
};

export default SocialLinks;
