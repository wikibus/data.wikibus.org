import { NamedNode } from 'rdf-js'
import type { Request } from 'express'
import namespace from '@rdfjs/namespace'

interface EVENTS {
  /**
   * Event emitted when a PDF has been uploaded to source
   */
  'events/SourcePdfUploaded': NamedNode
}

interface PROPERTIES {
  /**
   * Link property to the file resource which allows upload
   */
  uploadPdf: NamedNode
}

export const wba = (req: Request) => namespace<keyof EVENTS | keyof PROPERTIES>(req.rdf.namedNode('/').value)
