import { NamedNode } from 'rdf-js'
import namespace from '@rdfjs/namespace'

interface TYPES {
  /**
   * Collection of images
   */
  ImageCollection: NamedNode
}

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

  /**
   * Links brochure to collection of its images
   */
  images: NamedNode

  /**
   * Links an image to its source
   */
  imageOf: NamedNode
}

export const wba = namespace<keyof EVENTS | keyof PROPERTIES | keyof TYPES>('https://wikibus.org/api#')
