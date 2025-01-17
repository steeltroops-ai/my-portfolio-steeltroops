import React from 'react';
import PropTypes from 'prop-types';
import { CONTACT } from "../constants";

const Footer = ({ contact }) => {
  return (
    <footer className='flex-shrink-0 py-0 text-center'>
      <p className='my-4'>{contact.address}</p>
    </footer>
  );
};

Footer.propTypes = {
  contact: PropTypes.shape({
    address: PropTypes.string.isRequired,
  }),
};

Footer.defaultProps = {
  contact: CONTACT,
};

export default Footer;