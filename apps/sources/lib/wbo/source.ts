import type { Handler } from '@hydrofoil/knossos-events'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { INSERT } from '@tpluscode/sparql-builder'

export const initializeImagesResource: Handler = async ({ event, req }) => {
  if (!event.object) {
    return
  }

  const images = clownface({ dataset: $rdf.dataset() })
    .node(req.rdf.namedNode(`${event.object.id.value}/images`))

  const resource = await req.knossos.store.load(event.object.id)
  resource.addOut(schema.associatedMedia, images)

  await req.knossos.store.save(images)
  await INSERT.DATA`GRAPH ${event.object.id} {
        ${event.object.id} ${schema.associatedMedia} ${images.term}
    }`.execute(req.labyrinth.sparql.query)
}
