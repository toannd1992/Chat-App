import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, formatSize } from "@/lib/attachments";
import type { Attachment } from "@/types/typeChat";

// hiển thị ảnh, tệp và tin nhắn thoại bên trong bong bóng chat
const AttachmentList = ({
  attachments,
  isOwn,
}: {
  attachments: Attachment[];
  isOwn?: boolean;
}) => {
  const images = attachments.filter((a) => a.kind === "image");
  const audios = attachments.filter((a) => a.kind === "audio");
  const files = attachments.filter((a) => a.kind === "file");

  return (
    <div className="flex flex-col gap-2">
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-1",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2 w-56"
          )}
        >
          {images.map((img) => (
            <a
              key={img.url}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={img.url}
                alt={img.name}
                loading="lazy"
                className={cn(
                  "cursor-pointer rounded object-cover",
                  images.length === 1 ? "w-40 h-auto" : "h-28 w-full"
                )}
              />
            </a>
          ))}
        </div>
      )}

      {audios.map((a) => (
        <div key={a.url} className="flex flex-col gap-0.5">
          <audio controls preload="none" src={a.url} className="h-9 w-56" />
          {a.duration ? (
            <span className="text-[10px] opacity-60">
              {formatDuration(a.duration)}
            </span>
          ) : null}
        </div>
      ))}

      {files.map((f) => (
        <a
          key={f.url}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex w-56 items-center gap-2 rounded border p-2 hover:bg-muted/60",
            isOwn && "bg-background/60"
          )}
        >
          <FileText className="size-8 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {f.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatSize(f.size)}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default AttachmentList;
