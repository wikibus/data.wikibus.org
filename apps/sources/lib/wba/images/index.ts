import { Readable } from 'stream'
import { NO_CONTENT } from 'http-status'
import error from 'http-errors'
import type * as express from 'express-serve-static-core'
import asyncMiddleware, { combineMiddlewares } from 'middleware-async'
import multer from 'multer'
import { load } from '@wikibus/core/service'
import { ImageStorage } from '@wikibus/core'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import slugify from 'slugify'
import { created } from '@hydrofoil/knossos-events/activity'
import { hydra, schema } from '@tpluscode/rdf-ns-builders/strict'
import { fromPointer } from '@rdfine/schema/lib/ImageObject'
import RdfResourceImpl from '@tpluscode/rdfine'
import { ImageObjectBundle } from '@rdfine/schema/bundles'
import { wba } from '@wikibus/vocabularies/builders/strict'
import { save } from '@hydrofoil/knossos/lib/resource'

RdfResourceImpl.factory.addMixin(...ImageObjectBundle)

function processImage(req: express.Request, res: express.Response, imageService: ImageStorage) {
  return async (file: Readable | Buffer) => {
    const uploadedImage = await imageService.uploadBrochureImage(file)

    const image = clownface({ dataset: $rdf.dataset() }).namedNode(req.rdf.namedNode(`/image/${slugify(uploadedImage.id)}`))
    fromPointer(image, {
      types: [hydra.Resource],
      contentUrl: $rdf.namedNode(uploadedImage.contentUrl),
      thumbnail: {
        types: [schema.ImageObject],
        contentUrl: $rdf.namedNode(uploadedImage.thumbnailUrl),
      },
      [wba.imageOf.value]: req.hydra.resource.term,
    })

    try {
      await save({ resource: image, req })

      res.event(created(image))
    } catch (e) {
      req.knossos.log('Failed to upload image: "%s"', e.message)
      await imageService.deleteImage(uploadedImage.id)
      return false
    }

    return true
  }
}

const handleSingleImage = asyncMiddleware(async (req: express.Request, res, next) => {
  const saved = await processImage(req, res, res.locals.imageService)(req)

  if (saved) {
    return res.sendStatus(NO_CONTENT)
  }

  return next()
})

const handleMultiPartUpload = asyncMiddleware(async (req: express.Request, res, next) => {
  const { files } = req
  if (!Array.isArray(files)) {
    return next()
  }

  const saveImage = processImage(req, res, res.locals.imageService)
  const imagesToSave = files.map(async file => saveImage(file.buffer))

  await Promise.allSettled(imagesToSave)

  res.sendStatus(NO_CONTENT)
})

const loadImageService = asyncMiddleware(async (req: express.Request, res, next) => {
  res.locals = {
    imageService: await load<ImageStorage>(req, 'IMAGES'),
  }
  next()
})

export const uploadImage = combineMiddlewares(
  multer().any(),
  loadImageService,
  handleMultiPartUpload,
  handleSingleImage,
  (req, res, next) => next(new error.BadRequest('Unexpected file upload')))
