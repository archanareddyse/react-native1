/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {PlatformConfig} from '../AnimatedPlatformConfig';

import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';
import AnimatedWithChildren from './AnimatedWithChildren';

export default class AnimatedTransform extends AnimatedWithChildren {
  _transforms: $ReadOnlyArray<Object>;

  constructor(transforms: $ReadOnlyArray<Object>) {
    super();
    this._transforms = transforms;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__makeNative(platformConfig);
        }
      }
    });
    super.__makeNative(platformConfig);
  }

  __getValue(): $ReadOnlyArray<Object> {
    return this._transforms.map(transform => {
      const result: {[string]: any} = {};
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          result[key] = value.__getValue();
        } else {
          result[key] = value;
        }
      }
      return result;
    });
  }

  __getAnimatedValue(): $ReadOnlyArray<Object> {
    return this._transforms.map(transform => {
      const result: {[string]: any} = {};
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          result[key] = value.__getAnimatedValue();
        } else {
          // All transform components needed to recompose matrix
          result[key] = value;
        }
      }
      return result;
    });
  }

  __attach(): void {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__addChild(this);
        }
      }
    });
  }

  __detach(): void {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__removeChild(this);
        }
      }
    });
    super.__detach();
  }

  __getNativeConfig(): any {
    const transConfigs = [];

    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          transConfigs.push({
            type: 'animated',
            property: key,
            nodeTag: value.__getNativeTag(),
          });
        } else {
          transConfigs.push({
            type: 'static',
            property: key,
            value: NativeAnimatedHelper.transformDataType(value),
          });
        }
      }
    });

    NativeAnimatedHelper.validateTransform(transConfigs);
    return {
      type: 'transform',
      transforms: transConfigs,
    };
  }
}
