import type { NamedNode } from '@rdfjs/types'
import { FileStorage, ImageStorage, UploadedImage } from '@wikibus/core'
import $rdf from 'rdf-ext'
import { nanoid } from 'nanoid'

export class FileService implements FileStorage {
  async upload(name: string): Promise<NamedNode> {
    return $rdf.namedNode(`file:${name}`)
  }
}

export class ImageService extends ImageStorage {
  async deleteImage(): Promise<void> {
    return undefined
  }

  async upload(): Promise<UploadedImage> {
    const id = nanoid()
    return {
      id,
      thumbnailUrl: `/image/${id}/thumb`,
      contentUrl: `/image/${id}`,
    }
  }
}
