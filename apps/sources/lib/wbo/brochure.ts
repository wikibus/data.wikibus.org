import { Handler } from '@hydrofoil/knossos-events'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { wba } from '@wikibus/vocabularies/builders'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders/strict'

export const initWishlist: Handler = ({ event: { object: brochure }, req }) => {
  const wishlist = clownface({ dataset: $rdf.dataset() })
    .namedNode(`${brochure!.id.value}/wishlist`)
    .addOut(wba.wishlistOf, brochure!.id)
    .addOut(rdf.type, wba.Wishlist)
    .addOut(hydra.memberAssertion, ma => {
      ma.addOut(hydra.property, wba.brochure)
      ma.addOut(hydra.object, brochure!.id)
    })

  return req.knossos.store.save(wishlist)
}
