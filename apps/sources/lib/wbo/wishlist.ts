import { CREATED, NO_CONTENT } from 'http-status'
import asyncMiddleware, { combineMiddlewares } from 'middleware-async'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { nanoid } from 'nanoid'
import { acl, rdf } from '@tpluscode/rdf-ns-builders/strict'
import { wba, wbo } from '@wikibus/vocabularies/builders'
import { created } from '@hydrofoil/knossos-events/activity'
import { ASK } from '@tpluscode/sparql-builder'
import { save } from '@hydrofoil/knossos/lib/resource'
import type { Request } from 'express'

const doNothingIfAlreadyWishlisted = asyncMiddleware(async (req, res, next) => {
  const alreadyWishlisted = ASK`
    ?wishlistItem a ${wba.WishlistItem} .
    ?wishlistItem ${wbo.brochure} ${req.hydra.resource.term} .
    ?wishlistItem ${acl.owner} ${req.agent!.term} .
  `.execute(req.labyrinth.sparql.query)

  if (await alreadyWishlisted) {
    return res.sendStatus(NO_CONTENT)
  }

  return next()
})

export const addToWishlist = combineMiddlewares(doNothingIfAlreadyWishlisted, asyncMiddleware(async (req: Request, res) => {
  const brochure = req.hydra.resource.term
  const wishlistItem = clownface({ dataset: $rdf.dataset() })
    .namedNode(req.rdf.namedNode(`/wishlisted/${nanoid()}`))
    .addOut(rdf.type, wba.WishlistItem)
    .addOut(acl.owner, req.agent!)
    .addOut(wbo.brochure, brochure)

  await save({
    resource: wishlistItem,
    req,
  })
  res.event(created(wishlistItem))

  return res.sendStatus(CREATED)
}))
