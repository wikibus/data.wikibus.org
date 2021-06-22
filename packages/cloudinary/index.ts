import { promisify } from 'util'
import toStream from 'buffer-to-stream'
import type { UploadResponseCallback } from 'cloudinary'
import cloudinary = require('cloudinary')
import { ImageStorage, ImageStorageParams, UploadedImage } from '@wikibus/core'

interface CloudinaryParams {
  defaultTransformation: string
  thumbTransformation: string
}

export default class CloudinaryService extends ImageStorage {
  private readonly defaultTransformation: string;
  private readonly thumbTransformation: string;

  constructor({ defaultTransformation, thumbTransformation, ...rest }: ImageStorageParams & CloudinaryParams) {
    super({ ...rest })

    this.defaultTransformation = defaultTransformation
    this.thumbTransformation = thumbTransformation
  }

  get eagerTransformations() {
    return [
      { transformation: this.defaultTransformation },
      { transformation: this.thumbTransformation },
    ]
  }

  private uploadBuffer(buffer: Buffer, folder: string, cb: UploadResponseCallback) {
    const uploadStream = cloudinary.v2.uploader.upload_stream({
      folder,
      eager: this.eagerTransformations,
    }, cb)

    toStream(buffer).pipe(uploadStream)
  }

  deleteImage(publicId: string): Promise<void> {
    return cloudinary.v2.api.delete_resources([publicId])
  }

  async upload(image: Buffer, folder: string): Promise<UploadedImage> {
    const response = await promisify(this.uploadBuffer.bind(this))(image, folder)
    const createdImage = await cloudinary.v2.api.resource(response!.public_id)

    const defaultImage = createdImage.derived.find((derived: any) => derived.transformation === `t_${this.defaultTransformation}`)
    const thumbImage = createdImage.derived.find((derived: any) => derived.transformation === `t_${this.thumbTransformation}`)

    return {
      id: response!.public_id,
      contentUrl: defaultImage.secure_url,
      thumbnailUrl: thumbImage.secure_url,
    }
  }
}
