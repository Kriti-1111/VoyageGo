import crypto from "crypto";

export const generateEsewaSignature = ({
  total_amount,
  transaction_uuid,
  product_code,
}) => {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto
    .createHmac("sha256", process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
};

export const verifyEsewaSignature = (decoded) => {
  const { signed_field_names, signature } = decoded;
  const message = signed_field_names
    .split(",")
    .map((f) => `${f}=${decoded[f]}`)
    .join(",");
  const expected = crypto
    .createHmac("sha256", process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
  return expected === signature;
};
