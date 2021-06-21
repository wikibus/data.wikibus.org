import type { NamedNode } from '@rdfjs/types'
import { FileStorage } from '@wikibus/core'
import $rdf from 'rdf-ext'

export class FileService implements FileStorage {
  async upload(name: string): Promise<NamedNode> {
    return $rdf.namedNode(`file:${name}`)
  }
}
