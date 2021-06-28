import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'

export interface FileStorage {
  upload(name: string, folder: string, contentType: string, stream: Readable): Promise<NamedNode>
}

export interface UploadedImage {
  id: string
  contentUrl: string
  thumbnailUrl: string
}

export interface ImageStorageParams {
  brochuresFolder: string
}

export abstract class ImageStorage {
  protected constructor(private options: ImageStorageParams) {
  }

  abstract upload(image: Readable | Buffer, folder: string): Promise<UploadedImage>
  abstract deleteImage(publicId: string): Promise<void>

  uploadBrochureImage(image: Readable | Buffer): Promise<UploadedImage> {
    return this.upload(image, this.options.brochuresFolder)
  }
}
