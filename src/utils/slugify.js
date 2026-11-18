/**
 * Convert Vietnamese text to a URL-friendly slug.
 * "Nguyễn Văn Nam & Trần Thị Lan" -> "nguyen-van-nam-tran-thi-lan"
 */
export const slugify = (text = "") =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
