declare module 'emoji-mart-vue-fast/src' {
  import type { DefineComponent, SlotsType } from 'vue'

  export const Picker: DefineComponent<
    {
      data?: unknown
      set?: string
    },
    object,
    object,
    object,
    object,
    object,
    object,
    {
      select: [emoji: unknown]
    },
    string,
    object,
    object,
    object,
    SlotsType<{
      searchTemplate: { searchValue: string; onSearch: (value: string) => void }
    }>
  >

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  export class EmojiIndex {
    constructor(data: unknown)
  }
}

declare module 'emoji-mart-vue-fast/data/all.json' {
  const data: unknown
  export default data
}
