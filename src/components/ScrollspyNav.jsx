import { useState, useEffect } from 'react';

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
            className="hidden lg:block fixed right-4 xl:right-8 top-1/2 -translate-y-1/2 z-40"
        >
            <ul className="flex flex-col gap-3">
                {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                        <li key={section.id}>
                            <button
                                onClick={() => handleNavClick(section.id)}
                                className={`
                  text-xs xl:text-sm text-right transition-all duration-300 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-neutral-900
                  rounded px-2 py-1
                  ${isActive
                                        ? 'text-cyan-300 font-semibold opacity-100 scale-110'
                                        : 'text-neutral-400 font-normal opacity-60 hover:opacity-100 hover:scale-105'
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
