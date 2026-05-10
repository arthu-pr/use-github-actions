import type { Tag } from './Tag.js'
import type { Link } from './Link.js'

export interface Experience {
  id: string
  slug: string
  title: string
  company: string
  startDate: string
  endDate: string | null | undefined
  description: string
  tags: Tag[]
  links: Link[]
  createdAt: string | undefined
  updatedAt: string | undefined
}
