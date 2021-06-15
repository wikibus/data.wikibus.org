import '@hydrofoil/labyrinth'
import type { Handler } from '@hydrofoil/knossos-events'
import {dcterms} from '@tpluscode/rdf-ns-builders/strict';
import { toRdf } from 'rdf-literal'
import {INSERT} from '@tpluscode/sparql-builder';

export const setDateCreated: Handler = async ({event, req}) => {
    if (!event.object) {
        return
    }

    await INSERT.DATA`GRAPH ${event.object.id} {
        ${event.object.id} ${dcterms.created} ${toRdf(new Date())}
    }`.execute(req.labyrinth.sparql.query)
}
