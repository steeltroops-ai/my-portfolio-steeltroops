import {
  FiHome,
  FiUser,
  FiCpu,
  FiBriefcase,
  FiFolder,
  FiMail,
} from "react-icons/fi";

export const NAV_SECTIONS = [
  { id: "hero", label: "Home", icon: FiHome },
  { id: "about", label: "About", icon: FiUser },
  { id: "technologies", label: "Tech Stack", icon: FiCpu },
  { id: "experience", label: "Experience", icon: FiBriefcase },
  { id: "projects", label: "Projects", icon: FiFolder },
  { id: "contact", label: "Contact", icon: FiMail },
];

export const NAV_IDS = NAV_SECTIONS.map(s => s.id);
