// Local preview and JPEG conversion. Nothing is sent until the form is submitted.
const maxFileBytes = 10 * 1024 * 1024;
const maxUploadBytes = 2 * 1024 * 1024;

export async function preparePhoto(file: File): Promise<string> {
  if (!file.size || file.size > maxFileBytes)
    throw new Error("Choose an image up to 10 MB.");
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      throw new Error(
        "This image could not be opened. Try a JPEG, PNG, or WebP photo.",
      );
    }
    const ratio = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser could not prepare the photo.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const limit = Math.ceil(maxUploadBytes / 3) * 4;
    for (const quality of [0.88, 0.78, 0.68]) {
      const photo = canvas.toDataURL("image/jpeg", quality);
      if (
        photo.startsWith("data:image/jpeg;base64,") &&
        photo.split(",")[1].length < limit
      )
        return photo;
    }
    throw new Error(
      "This photo is too large after preparation. Retake it and try again.",
    );
  } finally {
    URL.revokeObjectURL(source);
  }
}
