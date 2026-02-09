import logo from "@/assets/mps.png";
import SocialLinks from "@/shared/components/ui/SocialLinks";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-4 sm:py-5 lg:py-6 mb-6 sm:mb-8 lg:mb-12 px-2 sm:px-0">
      <div className="flex items-center justify-center flex-shrink-0 h-8 sm:h-10">
        <img
          className="w-12 sm:w-14 md:w-16 transition-all duration-300 h-auto"
          src={logo}
          alt="Mayank Pratap Singh Logo"
          loading="eager"
        />
      </div>
      <SocialLinks />
    </nav>
  );
};

export default Navbar;
