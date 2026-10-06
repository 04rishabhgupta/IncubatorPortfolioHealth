export { cn } from "cn";

export function formatINR(rupees: number): string {
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(1)} Cr`;
  } else if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)} L`;
  }
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function formatINRExact(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

