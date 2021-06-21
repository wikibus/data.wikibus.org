import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import { BlobServiceClient } from '@azure/storage-blob'
import $rdf from 'rdf-ext'
import { FileStorage } from '@wikibus/core'

export class AzureBlobService implements FileStorage {
  constructor(private connectionString: string) {
  }

  async upload(name: string, container: string, blobContentType: string, stream: Readable): Promise<NamedNode> {
    const client = BlobServiceClient.fromConnectionString(this.connectionString)

    const blob = client.getContainerClient(container)
    const created = await blob.createIfNotExists()
    if (created.succeeded) {
      await blob.setAccessPolicy('blob')
    }

    const blobClient = blob.getBlobClient(name).getBlockBlobClient()
    await blobClient.uploadStream(stream, undefined, undefined, {
      blobHTTPHeaders: {
        blobContentType,
      },
    })

    return $rdf.namedNode(blob.url)
  }
}
