import { NO_CONTENT } from 'http-status'
import error from 'http-errors'
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

RdfResourceImpl.factory.addMixin(...ImageObjectBundle)

export const uploadImage = asyncMiddleware(combineMiddlewares(multer().any(), async (req, res, next) => {
  const { files } = req
  if (!Array.isArray(files)) {
    return next(new error.BadRequest('Unexpected file upload'))
  }

  const imageService = await load<ImageStorage>(req, 'IMAGES')

  const imagesToSave = files.map(async file => {
    const uploadedImage = await imageService.uploadBrochureImage(file.buffer)

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

    req.knossos.log(uploadedImage.thumbnailUrl)

    try {
      await req.knossos.store.save(image)

      res.event(created(image))
    } catch (e) {
      req.knossos.log('Failed to upload image: "%s"', e.message)
      await imageService.deleteImage(uploadedImage.id)
    }
  })

  await Promise.allSettled(imagesToSave)

  res.sendStatus(NO_CONTENT)
}))
