import { useRef, useState, useEffect } from "react";

export const useObserver = () => {
  const containerRef = useRef();
  const containerItemRefs = useRef([]);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = containerItemRefs.current.indexOf(entry.target);
          if (index !== -1) {
            setVisible((prev) => ({
              ...prev,
              [index]: entry.isIntersecting,
            }));
          }
        });
      },
      { root: containerRef.current, threshold: 0.4 }
    );

    // Observe each item
    containerItemRefs.current.forEach((el) => el && observer.observe(el));

    return () => {
      containerItemRefs.current.forEach((el) => el && observer.unobserve(el));
      observer.disconnect();
    };
  }, [containerRef.current]);

  return { containerRef, containerItemRefs, visible };
};
