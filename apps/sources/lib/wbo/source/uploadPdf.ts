import asyncMiddleware, { combineMiddlewares } from 'middleware-async'
import multer from 'multer'
import toStream from 'buffer-to-stream'
import error from 'http-errors'
import { load } from '@wikibus/core/service'
import { dcat, rdf, schema } from '@tpluscode/rdf-ns-builders/strict'
import { FileStorage } from '@wikibus/core'
import { describeResource } from '@hydrofoil/labyrinth/lib/query/describeResource'
import { CREATED } from 'http-status'
import { wb_events as wbe } from '@wikibus/vocabularies/builders/strict'

const pdfUploaded = multer({
  fileFilter(req, file, callback): void {
    callback(null, file.mimetype === 'application/pdf')
  },
  limits: {
    fileSize: Number.POSITIVE_INFINITY,
    files: 1,
  },
})

export default asyncMiddleware(combineMiddlewares(pdfUploaded.any(), async (req, res, next) => {
  const source = req.hydra.resource.term
  const identifier = source.value.substr(source.value.lastIndexOf('/') + 1)

  let file
  if (req.header('content-type') === 'application/pdf') {
    file = {
      contents: req,
      byteSize: Number.parseInt(req.header('content-length') || '0'),
      name: `${identifier}.pdf`,
    }
  } else if (Array.isArray(req.files)) {
    file = {
      contents: toStream(req.files[0].buffer),
      name: req.files[0].originalname,
      byteSize: req.files[0].size,
    }
  } else {
    return next(new error.BadRequest('Unexpected file upload'))
  }

  const fileStorage = await load<FileStorage>(req, 'FileService')
  const contentUrl = await fileStorage.upload(file.name, `source_${identifier}`, 'application/pdf', file.contents)

  const fileResource = (await req.knossos.store.load(req.hydra.term))
    .addOut(rdf.type, schema.MediaObject)
    .addOut(schema.name, file.name)
    .addOut(schema.contentUrl, contentUrl)
    .addOut(dcat.byteSize, file.byteSize)
    .addOut(schema.contentSize, `${Math.round(file.byteSize / 1024 / 1024 * 100) / 100} MB`)

  res.event({
    types: [wbe.SourcePdfUploaded],
    summary: `Uploaded file ${file.name} to source ${source.value}`,
    object: fileResource,
    origin: source,
  })

  await req.knossos.store.save(fileResource)
  return res.status(CREATED).quadStream(await describeResource(fileResource.term, req.labyrinth.sparql))
}))
