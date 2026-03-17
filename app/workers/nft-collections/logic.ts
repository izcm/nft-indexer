// export function mapTokenUriToNFT(
//   chainId: number,
//   address: Address,
//   tokenId: bigint,
//   tokenUri: string
// ): NFT {
//   const meta = parseTokenURI(tokenUri)

//   return {
//     id: `${chainId}:${address}:${tokenId}`,
//     chainId: chainId,
//     collection: address,
//     tokenId: tokenId,
//     ...meta,
//   }
// }

// // made defensively to future proof
// export function parseTokenURI(tokenUri: string): NFTMetadata {
//   let data

//   try {
//     const base64 = tokenUri.split(',')[1]
//     const json = atob(base64)
//     data = JSON.parse(json) as Record<string, unknown>

//     const name = typeof data.name === 'string' ? data.name : 'Unknown NFT'
//     const description = typeof data.description === 'string' ? data.description : ''
//     const image = typeof data.image === 'string' ? data.image : ''

//     const attributes: NFTAttribute[] = Array.isArray(data.attributes)
//       ? data.attributes
//           .map(a => {
//             // a is attribute => a is object
//             // std fmt: {trait_type, value}
//             if (
//               typeof a === 'object' &&
//               typeof (a.trait_type === 'string') &&
//               typeof (a.value === 'string')
//             ) {
//               return {
//                 trait_type: a.trait_type,
//                 value: a.value,
//               }
//             }
//             return null
//           })
//           .filter((a): a is NFTAttribute => a !== null)
//       : []

//     return {
//       name,
//       description,
//       image,
//       attributes,
//     }
//   } catch (err) {
//     return {
//       name: 'Unknown NFT',
//       description: '',
//       image: NFT_PLACEHOLDER_IMAGE,
//       attributes: [],
//     }
//   }
// }
