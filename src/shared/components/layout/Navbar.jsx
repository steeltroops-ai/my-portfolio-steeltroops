import logo from "@/assets/mps.png";
import SocialLinks from "@/shared/components/ui/SocialLinks";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-3 sm:py-4 lg:py-6 mb-6 sm:mb-8 lg:mb-16">
      <div className="flex items-center flex-shrink-0">
        <img
          className="w-14 sm:w-16 md:w-20 lg:w-24 mx-0 -ml-2 sm:-ml-4 -mr-2 sm:-mr-4"
          src={logo}
          alt="Mayank Pratap Singh Logo"
          width="96"
          height="96"
        />
      </div>
      <SocialLinks className="-mr-2 sm:-mr-4" />
    </nav>
  );
};

export default Navbar;
