import notionResources from '@/config/notion-resources.json'
import type { NotionResources } from '@/types/notion'

export function getNotionResources(): NotionResources {
  return notionResources as NotionResources
}

export function getPageByName(name: string) {
  const resources = getNotionResources()
  return Object.entries(resources.pages).find(([_, page]) => 
    page.name.toLowerCase() === name.toLowerCase()
  )?.[1]
}

export function getDatabaseByName(name: string) {
  const resources = getNotionResources()
  return Object.entries(resources.databases).find(([_, db]) => 
    db.name.toLowerCase() === name.toLowerCase()
  )?.[1]
}

export function getResourceByName(name: string) {
  return getPageByName(name) || getDatabaseByName(name)
} 