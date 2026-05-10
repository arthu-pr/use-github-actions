export interface Profile {
  firstName: string | undefined
  lastName: string | undefined
  title: string | undefined
  description: string | undefined
  address: { city?: string; country?: string } | undefined
  contacts: Array<{ type: string; value: string; label?: string }> | undefined
  socials: Array<{ platform: string; url: string; label?: string }> | undefined
}
