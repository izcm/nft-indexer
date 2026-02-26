import { orderRepo } from '#app/repos/order.repo.js'
import { settlementRepo } from '#app/repos/settlement.repo.js'
import { FindPageArgs } from '#app/repos/shared/types.js'

const findPageRoutes: Record<
  string,
  (args: FindPageArgs) => Promise<{ items: any[]; nextCursor: string | null }>
> = {
  Settlement: settlementRepo.findPage,
  Order: orderRepo.findPage,
}

// keys will be "Settlement", "Order" etc.
export async function findPage(
  key: 'Settlement' | 'Order',
  args: FindPageArgs,
  opts: { includeCollection?: boolean } = {}
) {
  const findPage = findPageRoutes[key]

  const page = await findPage(args)
}
