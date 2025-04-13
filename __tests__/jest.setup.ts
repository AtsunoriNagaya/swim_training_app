import { TextEncoder, TextDecoder } from 'util';
import fetch, { Response, Request, Headers } from 'node-fetch';

// BroadcastChannelのモック
class BroadcastChannelMock {
  constructor(channel: string) {
    return {
      postMessage: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn()
    };
  }
}

// グローバルオブジェクトの設定
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  Response,
  Request,
  Headers,
  fetch,
  BroadcastChannel: BroadcastChannelMock
});

import '@testing-library/jest-dom';
