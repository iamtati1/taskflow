import { motion } from "framer-motion";

function Card({ children, className = "" }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className={`
                rounded-2xl
                border border-white/10
                bg-white/5
                backdrop-blur-xl
                shadow-lg
                p-4
                ${className}
            `}
        >
            {children}
        </motion.div>
    );
}

export default Card;