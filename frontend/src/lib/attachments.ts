import imageCompression from "browser-image-compression";
import type { Attachment } from "@/types/typeChat";

export const MAX_ATTACHMENTS = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB mỗi tệp
export const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // 8MB mỗi tin nhắn

// tệp chờ gửi (đã chuyển sang base64)
export interface OutgoingAttachment {
  id: string;
  kind: Attachment["kind"];
  name: string;
  size: number;
  mime: string;
  dataUrl: string;
  duration?: number;
}

// đuôi tệp -> loại MIME, dùng khi trình duyệt không tự nhận ra loại tệp
const DOC_MIMES: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const ACCEPT_FILES =
  "image/*,audio/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

const readAsDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const newId = () => Math.random().toString(36).slice(2);

// chuyển tệp người dùng chọn thành tệp chờ gửi, nén ảnh cho nhẹ
export const prepareFile = async (file: File): Promise<OutgoingAttachment> => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let mime = file.type || DOC_MIMES[ext] || "";
  let blob: Blob = file;

  let kind: Attachment["kind"];
  if (mime.startsWith("image/")) kind = "image";
  else if (mime.startsWith("audio/")) kind = "audio";
  else if (Object.values(DOC_MIMES).includes(mime) || DOC_MIMES[ext]) {
    kind = "file";
    mime = DOC_MIMES[ext] ?? mime;
  } else {
    throw new Error(`"${file.name}": loại tệp này không được hỗ trợ`);
  }

  // GIF giữ nguyên để không mất chuyển động
  if (kind === "image" && mime !== "image/gif") {
    try {
      blob = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
    } catch {
      blob = file; // nén lỗi thì dùng ảnh gốc
    }
  }
  if (blob.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" vượt quá 5MB`);
  }
  return {
    id: newId(),
    kind,
    name: file.name,
    size: blob.size,
    mime,
    dataUrl: await readAsDataURL(blob),
  };
};

// tin nhắn thoại vừa ghi xong
export const prepareVoice = async (
  blob: Blob,
  duration: number
): Promise<OutgoingAttachment> => {
  if (blob.size > MAX_FILE_BYTES) throw new Error("Tin nhắn thoại quá dài");
  return {
    id: newId(),
    kind: "audio",
    name: "Tin nhắn thoại",
    size: blob.size,
    mime: blob.type,
    dataUrl: await readAsDataURL(blob),
    duration,
  };
};

// chữ xem trước của một tin nhắn (dùng cho trích dẫn, ghim)
export const previewOfMessage = (m: {
  content?: string | null;
  imgUrl?: string | null;
  attachments?: Attachment[];
}) => {
  if (m.content) return m.content;
  const first = m.attachments?.[0];
  if (first) {
    if (first.kind === "audio") return "[Tin nhắn thoại]";
    if (first.kind === "file") return `[Tệp] ${first.name}`;
    return "[Hình ảnh]";
  }
  return m.imgUrl ? "[Hình ảnh]" : "";
};
