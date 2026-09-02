// src/utils/passwordValidation.ts
export type PasswordRequirements = {
  length: boolean;
  uppercase: boolean;
  special: boolean;
};

export function getPasswordRequirements(
  password: string,
  minLength = 6,
): PasswordRequirements {
  return {
    length: password.length >= minLength,
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(
  password: string,
  minLength = 6,
): boolean {
  const r = getPasswordRequirements(password, minLength);
  return r.length && r.uppercase && r.special;
}
