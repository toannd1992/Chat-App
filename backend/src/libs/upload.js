import crypto from "crypto";
import cloudinary from "./cloudinary.js";
import AppError from "./appError.js";

export const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB mỗi tệp
const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // 8MB mỗi tin nhắn

const IMAGE_MIMES = /^image\/(png|jpe?g|gif|webp|bmp|heic|heif)$/;
const AUDIO_MIMES = /^audio\/(webm|ogg|mpeg|mp3|mp4|x-m4a|aac|wav|x-wav)$/;
// các loại tệp tài liệu được phép gửi (không cho phép file thực thi)
const FILE_TYPES = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
};

// data:<mime>[;param=value]*;base64,<data>
const DATA_URL = /^data:([^;,]+)((?:;[^;,]+)*);base64,/;

const cleanName = (name) =>
  String(name ?? "tệp")
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 100) || "tệp";

// kích thước thật của dữ liệu base64 sau khi giải mã
const decodedSize = (dataUrl, headerLength) => {
  const base64 = dataUrl.slice(headerLength);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

// phân tích và kiểm tra tệp gửi lên, chưa upload
const parseAttachment = (item) => {
  if (!item || typeof item.dataUrl !== "string") {
    throw new AppError(400, "Tệp đính kèm không hợp lệ");
  }
  const match = DATA_URL.exec(item.dataUrl);
  if (!match) throw new AppError(400, "Tệp đính kèm không hợp lệ");

  const mime = match[1].toLowerCase();
  let kind;
  if (IMAGE_MIMES.test(mime)) kind = "image";
  else if (AUDIO_MIMES.test(mime)) kind = "audio";
  else if (FILE_TYPES[mime]) kind = "file";
  else throw new AppError(400, "Loại tệp này không được hỗ trợ");

  const size = decodedSize(item.dataUrl, match[0].length);
  if (size > MAX_FILE_BYTES) {
    throw new AppError(400, "Mỗi tệp tối đa 5MB");
  }
  const duration = Number(item.duration);
  return {
    kind,
    mime,
    size,
    name: cleanName(item.name),
    // bỏ các tham số như ;codecs=opus vì Cloudinary không nhận
    dataUrl: `data:${mime};base64,${item.dataUrl.slice(match[0].length)}`,
    duration:
      kind === "audio" && Number.isFinite(duration)
        ? Math.min(Math.max(Math.round(duration), 0), 600)
        : undefined,
  };
};

const uploadOne = async (att) => {
  try {
    const options = { folder: "halu" };
    if (att.kind === "audio") options.resource_type = "video"; // Cloudinary xếp âm thanh vào "video"
    else if (att.kind === "file") {
      options.resource_type = "raw";
      // raw không tự thêm đuôi tệp nên đặt tên có đuôi để tải về đúng định dạng
      options.public_id = `${crypto.randomUUID()}${FILE_TYPES[att.mime]}`;
    } else options.resource_type = "image";

    const upload = await cloudinary.uploader.upload(att.dataUrl, options);
    return {
      kind: att.kind,
      url: upload.secure_url,
      publicId: upload.public_id,
      name: att.name,
      size: att.size,
      mime: att.mime,
      duration: att.duration,
    };
  } catch (error) {
    console.error("Lỗi upload tệp", error);
    throw new AppError(500, "Lỗi upload tệp");
  }
};

// kiểm tra toàn bộ rồi mới upload để không upload dở dang khi có tệp lỗi
export const uploadAttachments = async (items) => {
  if (!items) return [];
  if (!Array.isArray(items)) throw new AppError(400, "Tệp đính kèm không hợp lệ");
  if (items.length > MAX_ATTACHMENTS) {
    throw new AppError(400, `Tối đa ${MAX_ATTACHMENTS} tệp mỗi tin nhắn`);
  }
  const parsed = items.map(parseAttachment);
  const total = parsed.reduce((sum, a) => sum + a.size, 0);
  if (total > MAX_TOTAL_BYTES) {
    throw new AppError(400, "Tổng dung lượng tối đa 8MB mỗi tin nhắn");
  }
  return await Promise.all(parsed.map(uploadOne));
};

// ảnh đại diện chỉ nhận ảnh
export const uploadImageOnly = async (dataUrl) => {
  const att = parseAttachment({ dataUrl });
  if (att.kind !== "image") throw new AppError(400, "Chỉ nhận file ảnh");
  return await uploadOne(att);
};

// nội dung xem trước ở danh sách hội thoại / trích dẫn
export const previewOfMessage = (message) => {
  if (message.content) return message.content;
  const first = message.attachments?.[0];
  if (first) {
    if (first.kind === "audio") return "[Tin nhắn thoại]";
    if (first.kind === "file") return `[Tệp] ${first.name}`;
    return "[Hình ảnh]";
  }
  return message.imgUrl ? "[Hình ảnh]" : "";
};
