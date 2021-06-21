import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'

export interface FileStorage {
  upload(name: string, folder: string, contentType: string, stream: Readable): Promise<NamedNode>
}
