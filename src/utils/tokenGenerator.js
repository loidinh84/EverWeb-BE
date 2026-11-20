import crypto from "crypto";

export const generateSecureGuestToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateShortInviteCode = (length = 8) => {
  const characters = "ABCDEFGHJKLMNPQSTVWXZY23456789";

  let result = "";

  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += characters[randomBytes[i] % characters.length];
  }

  return result;
};
