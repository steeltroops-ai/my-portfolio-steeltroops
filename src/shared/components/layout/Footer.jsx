import { FiArrowUp, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import SocialLinks from "@/shared/components/ui/SocialLinks";
import { PERSONAL, CONTACT, SOCIALS } from "@/constants";

import { useNavigation } from "@/shared/context/NavigationContext";

const Footer = () => {
  const { handleNavClick } = useNavigation();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    handleNavClick("hero");
  };

  return (
    <footer className="py-12 sm:py-16 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid - Optimized & Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 md:gap-x-8 mb-12 items-start">
          {/* Brand Info - Left column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-normal text-white tracking-tight leading-none mb-1">
              {PERSONAL.name}
            </h3>
            <p className="text-sm font-light text-white/80 whitespace-nowrap">
              {PERSONAL.role}
            </p>
            <div className="flex flex-col items-center md:items-start">
              <p className="text-xs font-light text-neutral-300 leading-tight">
                {PERSONAL.tagline1}
              </p>
              <p className="text-xs font-light text-neutral-300 leading-tight">
                {PERSONAL.tagline2}
              </p>
            </div>
          </div>

          {/* Connect Column - Center column */}
          <div className="flex flex-col items-center border-y border-white/5 py-4 md:py-0 md:border-0 w-full">
            <h4 className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.25em] mb-4">
              Connect
            </h4>
            <SocialLinks className="justify-center" />
          </div>

          {/* Contact Info - Right column (Synced with Brand) */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <h4 className="text-lg font-normal text-neutral-400 tracking-tight leading-none mb-1">
              Get in Touch
            </h4>

            <a
              href={`mailto:${CONTACT.email}`}
              className="text-sm font-light text-white/80 hover:text-purple-300 transition-colors duration-200 flex items-center gap-2 group/email"
            >
              <FiMail className="w-3.5 h-3.5 text-neutral-500 group-hover/email:text-purple-400 transition-all" />
              <span>{CONTACT.email}</span>
            </a>

            <div className="flex flex-col items-center md:items-end">
              <div className="text-xs font-light text-neutral-300 flex items-center gap-2">
                <FiPhone className="w-3 h-3 text-neutral-500" />
                <span>{CONTACT.phoneNo}</span>
              </div>

              <div className="text-xs font-light text-neutral-300 flex items-center gap-2">
                <FiMapPin className="w-3 h-3 text-neutral-500" />
                <span>{PERSONAL.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left - Copyright & Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <p className="text-[10px] font-light text-neutral-500 uppercase tracking-wider">
                {currentYear} {PERSONAL.username}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-light text-neutral-500 uppercase tracking-wider">
                <Link
                  to="/blogs"
                  className="hover:text-neutral-300 transition-colors duration-200 uppercase"
                >
                  Blog
                </Link>
                <span className="text-neutral-800">|</span>
                <a
                  href={SOCIALS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-300 transition-colors duration-200 uppercase"
                >
                  Source
                </a>
              </div>
            </div>

            {/* Right - Back to Top */}
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2 px-4 py-2 text-[10px] font-light text-neutral-400 uppercase tracking-widest rounded-full border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all duration-300"
              aria-label="Scroll back to top"
            >
              <span>Back to Top</span>
              <FiArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
