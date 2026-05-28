/// <reference types="vite/client" />

import type {ThreeElement} from '@react-three/fiber';
import type {MeshLineGeometry, MeshLineMaterial} from 'meshline';

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: Omit<ThreeElement<typeof MeshLineMaterial>, 'args'> & {
      args?: ConstructorParameters<typeof MeshLineMaterial>;
    };
  }
}
