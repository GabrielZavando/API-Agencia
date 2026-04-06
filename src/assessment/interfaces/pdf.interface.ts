// interfaces locales para tipado de puppeteer ───────────────
export interface PuppeteerPage {
  setContent: (html: string, opts?: object) => Promise<void>
  pdf: (opts?: object) => Promise<Uint8Array>
}

export interface PuppeteerBrowser {
  newPage: () => Promise<PuppeteerPage>
  close: () => Promise<void>
}

export interface PuppeteerStatic {
  launch: (opts: {
    headless: boolean
    args: string[]
  }) => Promise<PuppeteerBrowser>
}
