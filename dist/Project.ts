import type { Tag } from './Tag.js'
import type { Link } from './Link.js'

export interface Project {
  id: string
  slug: string
  name: string
  pictures: string[]
  description: string
  tags: Tag[]
  links: Link[]
  createdAt: string | undefined
  updatedAt: string | undefined
}
