// Tests check what the app shows, not how it animates: finish every Framer
// Motion animation (including exits) immediately
import { MotionGlobalConfig } from "framer-motion";

MotionGlobalConfig.skipAnimations = true;
