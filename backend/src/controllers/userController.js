export const authMeController = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const test = async (req, res) => {
  return await res.status(200).json({ message: "ok" });
};
