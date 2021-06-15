import { Authentication } from '@hydrofoil/knossos/server'
import type {} from 'rdf-web-access-control'
import { attach } from 'rdf-express-node-factory'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { rdf } from '@tpluscode/rdf-ns-builders'

const authentication: Authentication = () => {
  return (req, res, next) => {
    attach(req)

    const sub = req.header('X-User')

    if (!req.agent && sub) {
      const header = req.header('X-Class')
      const classes = typeof header === 'string' ? header.split(',').map(s => s.trim()) : header || []

      req.agent = clownface({ dataset: $rdf.dataset() })
        .namedNode($rdf.namedNode(`https://users.wikibus.lndo.site/${sub}`))
        .addOut(rdf.type, classes.map(type => req.rdf.namedNode(`/api/${type}`)))
    }

    next()
  }
}

export default authentication
