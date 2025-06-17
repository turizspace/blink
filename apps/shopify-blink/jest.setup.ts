// Add fetch polyfill for tests
import { jest } from '@jest/globals';

const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    bodyUsed: false,
    body: null,
    clone: () => new Response()
  } as Response)
);

global.fetch = mockFetch as unknown as typeof fetch;
