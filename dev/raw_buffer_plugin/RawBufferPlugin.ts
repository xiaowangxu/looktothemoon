import { type Plugin } from 'vite'
import { readFileSync } from 'fs';

const rawBuffer: Plugin = {
  name: 'buffer-loader',
  transform(code, id) {
    const [path, query] = id.split('?');
    if (query !== 'raw-buffer') {
      return null;
    }
    const data = readFileSync(path);
    return `export default new Uint8Array([${data.toJSON().data}]);`;
  }
};

export default rawBuffer;