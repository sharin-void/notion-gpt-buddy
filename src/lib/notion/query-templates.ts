import notionConfig from '../../../notion-config.json'

// Types for our query parameters
export type SortDirection = 'ascending' | 'descending'
export type FilterOperator = 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
export type DateFilterOperator = 
  | 'equals' 
  | 'before' 
  | 'after' 
  | 'on_or_before' 
  | 'on_or_after' 
  | 'this_week' 
  | 'past_week' 
  | 'past_month' 
  | 'past_year' 
  | 'next_week' 
  | 'next_month' 
  | 'next_year' 
  | 'is_empty' 
  | 'is_not_empty'
export type DatabaseName = keyof typeof notionConfig.databases

interface NotionProperty {
  id: string
  type: string
  name: string
  select?: {
    options: Array<{
      id: string
      name: string
      color: string
    }>
  }
  multi_select?: {
    options: Array<{
      id: string
      name: string
      color: string
    }>
  }
  status?: {
    options: Array<{
      id: string
      name: string
      color: string
    }>
  }
}

interface DatabaseSchema {
  id: string
  title: string
  properties: Record<string, NotionProperty>
  lastUpdated: string
}

// Define the template type
type DatabaseTemplate = {
  type: 'database'
  id: string
  query: {
    filter?: {
      and: Array<{
        property: string
        [key: string]: any
      }>
    }
    sorts?: Array<{
      property: string
      direction: SortDirection
    }>
  }
}

// Base query templates for each database
export const databaseTemplates = Object.fromEntries(
  Object.entries(notionConfig.databases).map(([name, db]) => [
    name,
    {
      type: 'database',
      id: db.id,
      query: {
        filter: {
          and: []
        },
        sorts: []
      }
    }
  ])
) as unknown as Record<DatabaseName, DatabaseTemplate>

// Helper function to parse date strings with smart defaults
export function parseDateWithDefaults(dateStr: string): Date {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  
  // Try to parse the date string
  const dateMatch = dateStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?/i)
  
  if (dateMatch) {
    const [_, day, month, year] = dateMatch
    const monthIndex = new Date(`${month} 1, 2000`).getMonth() // Get month index (0-11)
    const parsedYear = year ? parseInt(year) : currentYear
    
    // If the parsed date is in the past and no year was specified, assume next occurrence
    const parsedDate = new Date(parsedYear, monthIndex, parseInt(day))
    if (!year && parsedDate < now) {
      parsedDate.setFullYear(currentYear + 1)
    }
    
    console.log('Parsed date:', {
      input: dateStr,
      parsed: parsedDate.toISOString(),
      currentYear,
      currentMonth
    })
    
    return parsedDate
  }
  
  // If we can't parse the date, return current date
  console.log('Could not parse date, using current date:', dateStr)
  return now
}

// Helper function to get a week's date range
export function getWeekDates(startDate?: Date | string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let weekStart: Date
  if (startDate) {
    // If a string is provided, parse it with defaults
    if (typeof startDate === 'string') {
      weekStart = parseDateWithDefaults(startDate)
    } else {
      weekStart = new Date(startDate)
    }
  } else {
    // Otherwise, calculate next week from today
    weekStart = new Date(today)
    const daysUntilMonday = (8 - today.getDay()) % 7 // Days until next Monday
    weekStart.setDate(today.getDate() + daysUntilMonday)
  }
  
  // Get the end of the week (Sunday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  // Set end time to end of day (23:59:59)
  weekEnd.setHours(23, 59, 59, 999)
  
  // For Notion API, we need to use the start of the next day for the end date
  const nextDay = new Date(weekEnd)
  nextDay.setDate(weekEnd.getDate() + 1)
  nextDay.setHours(0, 0, 0, 0)
  
  const dateRange = {
    start: weekStart.toISOString().split('T')[0],
    end: nextDay.toISOString().split('T')[0] // Use start of next day
  }
  
  console.log('Week date range:', {
    today: today.toISOString(),
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    nextDay: nextDay.toISOString(),
    dateRange
  })
  
  return dateRange
}

// Helper function to build a query from template
export function buildQuery(
  database: DatabaseName,
  filters: Array<{
    property: string
    filterType: string
    operator: FilterOperator | DateFilterOperator
    value: any
  }>,
  sort?: {
    property: string
    direction: SortDirection
  }
) {
  const template = databaseTemplates[database]
  const query = { ...template }

  // Apply filters
  if (filters.length > 0) {
    query.query.filter = {
      and: filters.map(filter => {
        // Special handling for date filters
        if (filter.filterType === 'date') {
          if (filter.operator === 'next_week') {
            const { start, end } = getWeekDates()
            return {
              property: filter.property,
              date: {
                on_or_after: start,
                before: end
              }
            }
          }
          // Handle specific date ranges
          if (filter.value && typeof filter.value === 'string') {
            if (filter.value.includes('week of')) {
              const { start, end } = getWeekDates(filter.value)
              return {
                property: filter.property,
                date: {
                  on_or_after: start,
                  before: end
                }
              }
            }
            // Handle single date queries
            const parsedDate = parseDateWithDefaults(filter.value)
            return {
              property: filter.property,
              date: {
                [filter.operator]: parsedDate.toISOString().split('T')[0]
              }
            }
          }
          return {
            property: filter.property,
            date: {
              [filter.operator]: filter.value
            }
          }
        }
        // Handle other filter types
        return {
          property: filter.property,
          [filter.filterType]: {
            [filter.operator]: filter.value
          }
        }
      })
    }
  }

  // Apply sort if provided
  if (sort) {
    query.query.sorts = [{
      property: sort.property,
      direction: sort.direction
    }]
  }

  console.log('Final query:', JSON.stringify(query, null, 2))
  return query
} 
