import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export default function CountUp({
    to,
    from = 0,
    direction = "up",
    delay = 0,
    duration = 2,
    className = "",
    startWhen = true,
    separator = "",
    onStart,
    onEnd,
}) {
    const ref = useRef(null);
    const motionValue = useMotionValue(direction === "down" ? to : from);

    // Spring physics for smooth animation
    const springValue = useSpring(motionValue, {
        damping: 60,
        stiffness: 100,
        duration: duration * 1000,
    });

    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        if (ref.current) {
            ref.current.textContent = String(direction === "down" ? to : from);
        }
    }, [from, to, direction]);

    useEffect(() => {
        if (startWhen && isInView) {
            if (typeof onStart === "function") {
                onStart();
            }

            const timeoutId = setTimeout(() => {
                motionValue.set(direction === "down" ? from : to);
            }, delay * 1000);

            const unsubscribe = springValue.on("change", (latest) => {
                if (ref.current) {
                    const options = {
                        useGrouping: !!separator,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    };

                    const formattedNumber = Intl.NumberFormat("en-US", options).format(
                        latest.toFixed(0)
                    );

                    ref.current.textContent = separator
                        ? formattedNumber.replace(/,/g, separator)
                        : formattedNumber;
                }
            });

            // Check for end of animation roughly
            const timeoutEndId = setTimeout(() => {
                if (typeof onEnd === "function") {
                    onEnd();
                }
            }, (delay + duration) * 1000 + 100); // slightly longer

            return () => {
                clearTimeout(timeoutId);
                clearTimeout(timeoutEndId);
                unsubscribe();
            };
        }
    }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

    return <span className={className} ref={ref} />;
}
