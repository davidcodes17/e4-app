export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email address";
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return "Phone number is required";
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phone)) return "Invalid phone number";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  // Optional: Add regex for uppercase, number, symbol
  return null;
};

export const validateRequired = (
  value: string,
  fieldName: string,
): string | null => {
  if (!value || value.trim() === "") return `${fieldName} is required`;
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name || name.trim().length < 2)
    return "Name must be at least 2 characters";
  return null;
};
