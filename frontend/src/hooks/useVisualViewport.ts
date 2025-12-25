import { useEffect, useState } from "react";

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    // Hàm cập nhật chiều cao
    const updateHeight = () => {
      if (window.visualViewport) {
        // Lấy chiều cao thực tế (đã trừ đi bàn phím)
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    // Chạy lần đầu
    updateHeight();

    // Lắng nghe sự kiện resize và scroll của visualViewport
    // Đây là API chuẩn để xử lý bàn phím ảo
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return viewportHeight;
}
