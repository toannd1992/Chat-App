import { useEffect, useState } from "react";

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number>(
    window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      // 1. Lấy chiều cao thực tế
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      setViewportHeight(height);

      // 2. 🔥 QUAN TRỌNG: Ép cửa sổ về đỉnh (0,0) để Header không bị đẩy lên
      window.scrollTo(0, 0);
    };

    // Lắng nghe visualViewport (API chuẩn cho Mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    // Fallback cho window
    window.addEventListener("resize", handleResize);

    // Chạy ngay lần đầu
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return viewportHeight;
}
