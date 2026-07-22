export const FORK_START_BLOCK: string | undefined = process.env.FORK_START_BLOCK

export const IS_DEMO: boolean = process.env.MODE === 'DEMO'

export const STRICT_INGESTION: boolean = process.env.STRICT_INGESTION === 'true'
