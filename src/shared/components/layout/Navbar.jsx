import logo from "@/assets/mps.png";
import SocialLinks from "@/shared/components/ui/SocialLinks";

const Navbar = () => {
  return (
    <header className="relative flex items-center justify-end min-h-[5rem] mb-6 sm:mb-8 lg:mb-12 px-4 sm:px-0">
      {/* Absolute Logo Entry - Perfectly Vertically Centered */}
      <div className="absolute left-4 sm:left-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
        <a
          href="/"
          className="flex items-center h-10 cursor-pointer"
          aria-label="Mayank Pratap Singh - Home"
        >
          <img
            className="w-15 h-auto transition-all duration-300"
            src={logo}
            alt="Logo"
            width={64}
            height={40}
            loading="eager"
          />
        </a>
      </div>

      {/* Social Links - Vertically Centered via parent's items-center */}
      <SocialLinks className="justify-end" />
    </header>
  );
};

export default Navbar;
