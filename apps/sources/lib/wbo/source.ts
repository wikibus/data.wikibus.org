import type { Handler } from '@hydrofoil/knossos-events'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { DELETE, INSERT, WITH } from '@tpluscode/sparql-builder'
import slugify from 'slugify'
import { nanoid } from 'nanoid'
import type { TransformVariable } from '@hydrofoil/knossos/collection'
import { schema, acl, hydra, rdf } from '@tpluscode/rdf-ns-builders/strict'
import { wba } from '../api'

export const initializeFileResource: Handler = async ({ event, req }) => {
  if (!event.object) {
    return
  }

  const fileResource = clownface({ dataset: $rdf.dataset() })
    .node(req.rdf.namedNode(`${event.object.id.value}/file`))
    .addOut(acl.owner, req.agent!)

  await req.knossos.store.save(fileResource)
  await INSERT.DATA`GRAPH ${event.object.id} {
      ${event.object.id} ${wba.uploadPdf} ${fileResource.term}
  }`.execute(req.labyrinth.sparql.query)
}

export const initializeImagesCollection: Handler = async ({ event: { object: source }, req }) => {
  if (!source) {
    return
  }

  const imagesCollection = clownface({ dataset: $rdf.dataset() })
    .node(req.rdf.namedNode(`${source.id.value}/images`))
    .addOut(rdf.type, wba.ImageCollection)
    .addOut(hydra.memberAssertion, ma => {
      ma.addOut(hydra.property, rdf.type)
      ma.addOut(hydra.object, schema.ImageObject)
    })
    .addOut(hydra.memberAssertion, ma => {
      ma.addOut(hydra.property, wba.imageOf)
      ma.addOut(hydra.object, source.id)
    })
    .addOut(acl.owner, req.agent!)

  await req.knossos.store.save(imagesCollection)
  await INSERT.DATA`GRAPH ${source.id} {
    ${source.id} ${wba.images} ${imagesCollection.term}
  }`.execute(req.labyrinth.sparql.query)
}

export const setMainImage: Handler = ({ event: { object: image }, req }) => {
  if (!image) {
    return
  }

  return INSERT`
    GRAPH ?source {
      ?source ${schema.primaryImageOfPage} ${image.id} .
    }
  `.WHERE`
    ${image.id} ${wba.imageOf} ?source .

    MINUS {
      ?source ${schema.primaryImageOfPage} ?primaryImage .
    }
  `.execute(req.labyrinth.sparql.query)
}

export const setConcreteFileResource: Handler = async ({ req, event: { object: file, origin: source } }) => {
  if (!file || !source) {
    return
  }

  const { uploadPdf } = wba

  await WITH(source.id.value, DELETE`
    ?source ${uploadPdf} ${file.id}
  `.INSERT`
    ?source ${schema.associatedMedia} ${file.id}
  `.WHERE`
    OPTIONAL { ?source ${uploadPdf} ${file.id} }
  `).execute(req.labyrinth.sparql.query)
}

export const slugifyTitle: TransformVariable = (term) => {
  return $rdf.literal(`${slugify(term.value, { lower: true })}-${nanoid(6)}`)
}
