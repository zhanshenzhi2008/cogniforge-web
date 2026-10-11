import { describe, expect, it } from 'vitest'
import {
  assertDocBatch,
  ChatDocError,
  guessChatDocType,
  isAllowedChatDoc,
  partitionChatDocs,
  toSendAttachments,
} from '../chatAttachments'

describe('chatAttachments', () => {
  it('guesses type from extension and mime', () => {
    expect(guessChatDocType(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe('pdf')
    expect(guessChatDocType(new File(['x'], 'a.MD', { type: '' }))).toBe('md')
    expect(guessChatDocType(new File(['x'], 'a.png', { type: 'image/png' }))).toBe('')
  })

  it('partitions docs vs rejected', () => {
    const { docs, rejected } = partitionChatDocs([
      new File(['x'], 'a.pdf', { type: 'application/pdf' }),
      new File(['x'], 'b.png', { type: 'image/png' }),
    ])
    expect(docs).toHaveLength(1)
    expect(rejected).toHaveLength(1)
  })

  it('assertDocBatch enforces caps', () => {
    expect(() => assertDocBatch([new File(['x'], 'a.pdf')], 5)).toThrow(ChatDocError)
    const big = new File([new Uint8Array(51 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    expect(() => assertDocBatch([big], 0)).toThrow(ChatDocError)
  })

  it('toSendAttachments skips uploading/failed', () => {
    expect(
      toSendAttachments([
        { localId: '1', id: 'd1', name: 'a.pdf', file_type: 'pdf', status: 'completed' },
        { localId: '2', name: 'b.pdf', file_type: 'pdf', status: 'uploading' },
        { localId: '3', id: 'd3', name: 'c.pdf', file_type: 'pdf', status: 'failed' },
      ]),
    ).toEqual([
      { id: 'd1', name: 'a.pdf', file_type: 'pdf', status: 'completed', chunk_count: undefined },
    ])
  })

  it('isAllowedChatDoc', () => {
    expect(isAllowedChatDoc(new File(['x'], 'a.docx'))).toBe(true)
    expect(isAllowedChatDoc(new File(['x'], 'a.exe'))).toBe(false)
  })
})
