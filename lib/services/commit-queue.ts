/**
 * Commit queue for serializing GitHub file commits.
 * Processes one commit at a time to avoid 409 conflicts from stale SHAs.
 */

export type CommitJobType = "pages" | "sections" | "common" | "media"

export interface CommitJob {
  type: CommitJobType
  data: unknown
  message?: string
}

const queue: CommitJob[] = []
let isProcessing = false

/**
 * Add a commit job to the queue.
 */
export function enqueueCommit(job: CommitJob): void {
  queue.push(job)
}

/**
 * Get the current queue length.
 */
export function getQueueLength(): number {
  return queue.length
}

/**
 * Check if the queue is currently processing.
 */
export function isQueueProcessing(): boolean {
  return isProcessing
}

export type CommitExecutor = (
  job: CommitJob
) => Promise<{ newSha: string; [key: string]: unknown }>

/**
 * Process all queued commits sequentially.
 * The executor is responsible for calling the appropriate save API and updating store state.
 * On 409 conflict, the executor should re-fetch the file's SHA, update the store, and retry.
 * @param executor Function that executes a single job and returns the new SHA
 * @throws Re-throws the first error encountered; remaining jobs stay in queue
 */
export async function processQueue(executor: CommitExecutor): Promise<void> {
  if (isProcessing) return
  if (queue.length === 0) return

  isProcessing = true
  try {
    while (queue.length > 0) {
      const job = queue.shift()!
      await executor(job)
    }
  } finally {
    isProcessing = false
  }
}

/**
 * Clear all queued jobs (e.g. on error or cancel).
 */
export function clearQueue(): void {
  queue.length = 0
}
