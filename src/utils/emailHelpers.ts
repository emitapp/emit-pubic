export const isSchoolDomain = (domain: string): boolean => domain.endsWith(".edu")
export const getDomainFromEmail = (email: string): string => email.split("@").pop() ?? ""