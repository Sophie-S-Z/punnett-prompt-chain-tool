"use server";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { adminAccess } from "@/lib/admin";
export async function uploadStudioImage(form: FormData) {
  const access = await adminAccess();
  if (access.state !== "admin")
    return {
      ok: false as const,
      message: "Google superadmin access required.",
    };
  const file = form.get("image");
  if (
    !(file instanceof File) ||
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.type,
    ) ||
    file.size === 0 ||
    file.size > 8 * 1024 * 1024
  )
    return {
      ok: false as const,
      message: "Choose a JPEG, PNG, WebP, or GIF under 8 MB.",
    };
  let jpeg: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40000000,
      animated: false,
    });
    const meta = await image.metadata();
    if (!meta.format || !["jpeg", "png", "webp", "gif"].includes(meta.format))
      throw new Error();
    jpeg = await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "white" })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return {
      ok: false as const,
      message: "This image could not be opened. Choose another image.",
    };
  }
  if (jpeg.length > 2 * 1024 * 1024)
    return { ok: false as const, message: "Choose a smaller image." };
  const path = `${access.user!.id}/studio/${randomUUID()}.jpg`;
  try {
    const stored = await access.client.storage
      .from("caption-images")
      .upload(path, jpeg, { contentType: "image/jpeg", upsert: false });
    if (stored.error)
      return { ok: false as const, message: "The upload failed. Try again." };
    const label =
      file.name.replace(/\.[^.]+$/, "").slice(0, 200) || "Uploaded image";
    const saved = await access.client.rpc("punnett_studio_upload", {
      path_input: path,
      title_input: label,
    });
    if (saved.error || typeof saved.data !== "string") {
      await access.client.storage.from("caption-images").remove([path]);
      return {
        ok: false as const,
        message: saved.error?.message.includes("upload_limit")
          ? "You can upload 30 test images in 24 hours."
          : "The image could not be saved. Try again.",
      };
    }
    revalidatePath("/chains");
    return { ok: true as const, id: saved.data, label };
  } catch {
    return {
      ok: false as const,
      message:
        "The connection stopped. Reload before retrying to check whether the upload was saved.",
    };
  }
}
