import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ScrollspyNav = () => {
    const [activeSection, setActiveSection] = useState('hero');

    const sections = [
        { id: 'hero', label: 'Home' },
        { id: 'about', label: 'About' },
        { id: 'technologies', label: 'Tech Stack' },
        { id: 'experience', label: 'Experience' },
        { id: 'projects', label: 'Projects' },
        { id: 'contact', label: 'Contact' }
    ];

    // Handle navigation click to scroll to target section
    const handleNavClick = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    useEffect(() => {
        // Check if Intersection Observer is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('Intersection Observer not supported');
            return;
        }

        // Configure observer with rootMargin to trigger when section crosses viewport center
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0
        };

        // Callback to update activeSection when sections intersect
        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        // Create the observer
        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Query all section elements by ID and observe them
        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
            }
        });

        // Cleanup function to disconnect observer on unmount
        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <nav
            aria-label="Page sections"
            className="hidden lg:block fixed right-4 xl:right-8 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
        >
            <ul className="flex flex-col gap-2 items-end pointer-events-auto">
                {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                        <li key={section.id} className="w-auto">
                            <button
                                onClick={() => handleNavClick(section.id)}
                                className={`
                  block text-xs xl:text-sm whitespace-nowrap transition-all duration-300 cursor-pointer
                  focus:outline-none
                  ${isActive
                                        ? 'text-purple-300 font-medium bg-purple-500/20 border border-purple-400/50 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg'
                                        : 'text-neutral-400 font-normal hover:text-neutral-300 px-2 py-1'
                                    }
                `}
                                aria-current={isActive ? 'true' : 'false'}
                            >
                                {section.label}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default ScrollspyNav;
