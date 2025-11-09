import PropTypes from "prop-types";
import { CONTACT } from "../constants";

const Footer = ({ contact = CONTACT }) => {
  return (
    <footer className="flex-shrink-0 py-0 text-center">
      <p className="my-4 text-xs sm:text-sm md:text-base px-4">{contact.address}</p>
    </footer>
  );
};

Footer.propTypes = {
  contact: PropTypes.shape({
    address: PropTypes.string.isRequired,
  }),
};

export default Footer;
