import { motion } from "framer-motion";

const SectionDivider = () => {
  return (
    <div className="py-8 sm:py-12 lg:py-16 flex justify-center items-center">
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: "80%", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent relative"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-800 border border-neutral-700 shadow-[0_0_8px_rgba(0,0,0,0.5)]"></div>
      </motion.div>
    </div>
  );
};

export default SectionDivider;
