const COUNTRY_RULES = [
  {
    code: "+84",
    name: "Việt Nam",
    regex: /^\+84(3[2-9]|5[5689]|7[06-9]|8[1-9]|9\d)\d{7}$/,
  },
  {
    code: "+1",
    name: "Mỹ / Canada",
    regex: /^\+1[2-9]\d{2}[2-9]\d{6}$/,
  },
  {
    code: "+61",
    name: "Úc",
    regex: /^\+614\d{8}$/,
  },
  {
    code: "+44",
    name: "Anh",
    regex: /^\+447\d{9}$/,
  },
  {
    code: "+65",
    name: "Singapore",
    regex: /^\+65[89]\d{7}$/,
  },
  {
    code: "+81",
    name: "Nhật Bản",
    regex: /^\+81[789]0\d{8}$/,
  },
  {
    code: "+82",
    name: "Hàn Quốc",
    regex: /^\+821[01]\d{7,8}$/,
  },
  {
    code: "+86",
    name: "Trung Quốc",
    regex: /^\+861[3-9]\d{9}$/,
  },
  {
    code: "+886",
    name: "Đài Loan",
    regex: /^\+8869\d{8}$/,
  },
  {
    code: "+33",
    name: "Pháp",
    regex: /^\+33[67]\d{8}$/,
  },
  {
    code: "+49",
    name: "Đức",
    regex: /^\+491[567]\d{8,9}$/,
  },
];

const VN_DOMESTIC_REGEX = /^0(3[2-9]|5[5689]|7[06-9]|8[1-9]|9\d)\d{7}$/;

const GENERAL_INTERNATIONAL_REGEX = /^\+[1-9]\d{7,14}$/;

export const validateAndNormalizePhone = (val) => {
  if (!val) return { isValid: true, normalized: null };

  let cleaned = String(val)
    .trim()
    .replace(/[\s\.\-\(\)]/g, "");
  if (!cleaned) return { isValid: true, normalized: null };

  if (cleaned.startsWith("0")) {
    if (!VN_DOMESTIC_REGEX.test(cleaned)) {
      return { isValid: false, error: "Số điện thoại không hợp lệ!" };
    }
    return { isValid: true, normalized: cleaned };
  }

  if (cleaned.startsWith("84") && cleaned.length === 11) {
    cleaned = "+" + cleaned;
  }

  if (!cleaned.startsWith("+")) {
    return { isValid: false, error: "Số điện thoại không hợp lệ!" };
  }

  if (cleaned.startsWith("+840")) {
    cleaned = "+84" + cleaned.slice(4);
  }

  const matchedRule = COUNTRY_RULES.find((rule) =>
    cleaned.startsWith(rule.code),
  );
  if (matchedRule) {
    if (!matchedRule.regex.test(cleaned)) {
      return { isValid: false, error: "Số điện thoại không hợp lệ!" };
    }
    return { isValid: true, normalized: cleaned };
  }

  if (!GENERAL_INTERNATIONAL_REGEX.test(cleaned)) {
    return { isValid: false, error: "Số điện thoại không hợp lệ!" };
  }

  return { isValid: true, normalized: cleaned };
};
