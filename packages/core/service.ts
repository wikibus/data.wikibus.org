import type { Request } from 'express'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { code, knossos } from '@hydrofoil/vocabularies/builders'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import loadArguments from 'rdf-loader-code/arguments'

type Constructor<T> = new (...args: any[]) => T

function isSingleNode(ptr: AnyPointer): ptr is GraphPointer {
  return !!ptr.term
}

export async function load<T>(req: Request, service: string): Promise<T> {
  const id = clownface(req.hydra.api).out(knossos.configuration).term
  if (!id) {
    throw new Error('Missing configuration')
  }

  const configuration = (await req.knossos.store.load(id))
    .out(knossos.environment)
    .has(schema.identifier, process.env.ENV || 'PROD')

  const serviceNode = configuration.out(knossos.service).has(schema.name, service).out(code.implementedBy)

  if (!isSingleNode(serviceNode)) {
    throw new Error(`Failed to load ${service}`)
  }

  const Service = await req.loadCode<Constructor<T>>(serviceNode)

  const ctorArgs = await loadArguments(serviceNode, {
    basePath: req.hydra.api.codePath,
    loaderRegistry: req.hydra.api.loaderRegistry,
  })

  if (!Service) {
    throw new Error(`Failed to load ${service}`)
  }

  return new Service(...ctorArgs)
}
