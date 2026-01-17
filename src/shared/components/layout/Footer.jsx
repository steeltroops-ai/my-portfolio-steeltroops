import { FiArrowUp, FiMail, FiMapPin } from "react-icons/fi";
import { Link } from "react-router-dom";
import SocialLinks from "@/shared/components/ui/SocialLinks";
import { PERSONAL, CONTACT, SOCIALS } from "@/constants";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="py-12 sm:py-16 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand Column */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
              {PERSONAL.name}
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto md:mx-0">
              {PERSONAL.tagline}
              <br />
              {PERSONAL.role}
            </p>
          </div>

          {/* Connect Column */}
          <div className="text-center">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Connect
            </h4>
            <SocialLinks className="justify-center" />
          </div>

          {/* Contact Column */}
          <div className="text-center md:text-right">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Get in Touch
            </h4>
            <div className="space-y-2">
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center justify-center md:justify-end gap-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
              >
                <FiMail className="w-4 h-4" />
                <span>{CONTACT.email}</span>
              </a>
              <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-neutral-500">
                <FiMapPin className="w-4 h-4" />
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
              <p className="text-xs text-neutral-500">
                {currentYear} {PERSONAL.username}
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-600">
                <Link
                  to="/blogs"
                  className="hover:text-neutral-300 transition-colors duration-200"
                >
                  Blog
                </Link>
                <span className="text-neutral-700">|</span>
                <a
                  href={SOCIALS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-300 transition-colors duration-200"
                >
                  Source
                </a>
              </div>
            </div>

            {/* Right - Back to Top */}
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-500 rounded-full border border-neutral-800 hover:border-neutral-700 hover:text-neutral-300 transition-all duration-300"
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
