import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

// When the email doesn't exist we still run a bcrypt compare against a dummy hash,
// so the response takes the same time — attackers can't discover registered emails by timing.
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("clinicyza-dummy-password", ROUNDS));

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash || (await getDummyHash()));
}
