declare module 'emoji-mart-vue-fast/src' {
  import { DefineComponent, SlotsType } from 'vue'

  export const Picker: DefineComponent<
    {
      data?: any
      set?: string
    },
    {},
    {},
    {},
    {},
    {},
    {},
    {
      select: [emoji: any]
    },
    string,
    {},
    {},
    {},
    SlotsType<{
      searchTemplate: { searchValue: string; onSearch: (value: string) => void }
    }>
  >
  export class EmojiIndex {
    constructor(data: any)
  }
}

declare module 'emoji-mart-vue-fast/data/all.json' {
  const data: any
  export default data
}
