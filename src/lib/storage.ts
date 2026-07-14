import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600,
  useWebWorker: false, // web worker can hang in some browsers
};

/**
 * Compress an image file and upload it to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadPhoto(
  file: File,
  path: string // e.g. "options/{optionId}/{fileName}"
): Promise<string> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
}

/**
 * Generate a unique storage path for an option photo.
 */
export function optionPhotoPath(optionId: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "jpg";
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  return `options/${optionId}/${uniqueName}`;
}

/**
 * Generate a unique storage path for a schedule item photo.
 */
export function schedulePhotoPath(itemId: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "jpg";
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  return `schedule/${itemId}/${uniqueName}`;
}
