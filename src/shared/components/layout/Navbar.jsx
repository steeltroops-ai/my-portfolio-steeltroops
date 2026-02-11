import logo from "@/assets/mps.png";
import SocialLinks from "@/shared/components/ui/SocialLinks";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between py-4 sm:py-5 lg:py-6 mb-6 sm:mb-8 lg:mb-12 px-2 sm:px-0">
      
      <div className="flex items-center justify-center flex-shrink-0">
        <a
          href="/"
          className="block h-8 sm:h-10 cursor-pointer"
          aria-label="Mayank Pratap Singh - Home"
        >
          <img
            className="w-12 sm:w-14 md:w-16 h-auto transition-all duration-300"
            src={logo}
            alt="Logo"
            width={64}
            height={40}
            loading="eager"
          />
        </a>
      </div>
      <SocialLinks />
    </header>
  );
};

export default Navbar;
