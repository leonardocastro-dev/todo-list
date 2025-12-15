declare module 'emoji-mart-vue-fast/src' {
  import { DefineComponent } from 'vue'

  export interface EmojiData {
    id: string
    name: string
    native: string
    unified: string
    keywords: string[]
    shortcodes: string
  }

  export class EmojiIndex {
    constructor(data: any)
    search(query: string): EmojiData[]
  }

  export const Picker: DefineComponent<{
    data: EmojiIndex
    set?: string
    onSelect?: (emoji: EmojiData) => void
  }>
}

declare module 'emoji-mart-vue-fast/data/all.json' {
  const data: any
  export default data
}

declare module 'emoji-mart-vue-fast/css/emoji-mart.css'
