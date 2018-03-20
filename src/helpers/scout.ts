import { DevInspector } from '@stencil/core/dist/declarations';
import { ValueObject } from '~helpers/declarations';

import * as d from './declarations';

/**
 * Scout is a special component of the extension.
 * It is a singleton injected by the "injector", but communicates with it via content and background scripts.
 */

(() => {
  class Scout {
    /** Reference to current singleton instance */
    private static _instance: Scout;

    /** The current devInspector object injected by Stencil itself */
    private devInspector: DevInspector = (window as any).devInspector || null;

    /** Flag for indicating if component computation is in progress */
    private processing = false;

    /** Current selected element */
    private currentElement = null;

    /** Instance of the current selected element */
    private currentComponentInstance = null;

    /** Next element to be computed */
    private queuedElement = null;

    private observer: MutationObserver = null;

    private constructor() {}

    static get Instance(): Scout {
      return this._instance || (this._instance = new Scout());
    }

    /** Message dispatcher wrapper */
    private postMsg(type: string, value: any) {
      const message = {
        data: {
          sender: 'scout',
          type,
          value
        },
        source: 'stencil-inspector'
      };

      if (type !== 'component') {
        window.postMessage(message, '*');
      } else {
        this.processing = false;

        if (this.queuedElement) {
          const newElement = this.queuedElement;
          this.queuedElement = null;

          this.getComponent(newElement);
        } else {
          window.postMessage(message, '*');

          if (!this.observer) {
            this.startObserver();
          }
        }
      }
    }

    /** The handler of the observer */
    private elementChangeHandler = () => {
      this.postMsg('domChanged', null);
    }

    /** Create an observer that notifies the panel about DOM changes */
    private startObserver() {
      if (this.currentElement) {
        this.observer = new MutationObserver(() => {
          this.postMsg('domChanged', null);
        });

        this.observer.observe(this.currentElement, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        });

        /** Input elements cannot be observed properly using Mutation Observer */
        this.currentElement.addEventListener('input', this.elementChangeHandler);
      }
    }

    /** Kill the observer */
    private stopObserver() {
      if (this.observer) {
        this.observer.disconnect();

        this.currentElement.removeEventListener('input', this.elementChangeHandler);

        this.observer = null;
      }
    }

    /**
     * A variation of Douglas Crockford's decycle function.
     *
     * Chrome does not support sending messages which cannot be stringified. There are a couple of aspects we need to
     * have in mind: functions, undefined values, DOM elements, Window object, circular references etc.
     *
     * In order to bypass these, we are creating some special objects that will be handled by the injector.
     */
    private decycle(object: any) {
      const objects = new WeakMap();

      const derez = (value: any, path: string) => {
        let oldPath;
        let nu;

        const valueType = typeof value;

        switch (valueType) {
          case 'undefined':
            return {
              __stencil_obj_type__: 'undefined'
            };

          case 'function':
            return {
              __stencil_obj_type__: 'function',
              __stencil_obj_name__: value.name,
              __stencil_obj_body__: value.toString()
            };

          case 'object':
            if (value instanceof HTMLDocument) {
              return {
                __stencil_obj_type__: 'element',
                __stencil_obj_name__: 'Document'
              };
            } else if (value instanceof HTMLElement) {
              return {
                __stencil_obj_type__: 'element',
                __stencil_obj_name__: value.tagName.toLowerCase()
              };
            } else if (value instanceof Window) {
              return {
                __stencil_obj_type__: 'window',
              };
            } else if (
              value !== null &&
              !(value instanceof Boolean) &&
              !(value instanceof Date) &&
              !(value instanceof Number) &&
              !(value instanceof RegExp) &&
              !(value instanceof String)
            ) {
              oldPath = objects.get(value);

              if (oldPath !== undefined) {
                return {
                  __stencil_obj_path__: oldPath
                };
              }

              objects.set(value, path);

              if (Array.isArray(value)) {
                nu = [];

                value.forEach((element, i) => {
                  nu[i] = derez(element, `${path}[${i}]`);
                });
              } else {
                nu = {};

                Object.getOwnPropertyNames(value).forEach(name => {
                  nu[name] = derez(value[name], `${path}[${JSON.stringify(name)}]`);
                });
              }

              return nu;
            } else {
              return value;
            }

          default:
            return value;
        }
      };

      return derez(object, '$');
    }

    /**
     * Map the values of props, states etc.
     *
     * In the case of props, we need to pass some flags to the value object to build the edit feature.
     */
    private mapValue(members: d.MemberUnion[], instance, parsedKeys: string[], canEdit = false, editInstance = false): d.MembersMap {
      return members.reduce<d.MembersMap>((acc, member) => {
        const {
          name,
          event,
          method,
          ...props
        } = member;

        const actualName = event || name;
        const valueName = method || actualName;

        parsedKeys.push(valueName);

        const value: ValueObject<any> = {
          __stencil_obj_type__: 'value',
          value: instance[valueName]
        };

        let parsedMember: any = value;

        if (Object.keys(props || {}).length > 0) {
          let type = typeof value.value;
          let canEditType = type === 'string' || type === 'boolean' || type === 'number';

          parsedMember = {
            ...props,
            __stencil_obj_map_subvalue__: true,
            value: {
              ...value,
              __stencil_obj_edit_member__: valueName,
              __stencil_obj_edit_instance__: editInstance
            }
          };

          if (parsedMember.type) {
            type = parsedMember.type;
            canEditType = type === 'string' || type === 'boolean' || type === 'number';
          }

          parsedMember.value = {
            ...parsedMember.value,
            __stencil_obj_edit__: canEdit && canEditType,
            __stencil_obj_edit_type__: type
          };

          if (parsedMember.watchers) {
            parsedMember.watchers = parsedMember.watchers.reduce((watchersMap, watcher) => {
              watchersMap[watcher] = instance[watcher];

              return watchersMap;
            }, {});
          }
        }

        acc[actualName] = this.decycle(parsedMember);

        return acc;
      }, {});
    }

    /** Build a big object from instance and it's prototype */
    private buildFullInstance(instance: object): object {
      const result = {};

      const instanceKeys = Object.getOwnPropertyNames(instance);

      instanceKeys.forEach(instanceKey => result[instanceKey] = instance[instanceKey]);

      const instanceProto = Object.getPrototypeOf(instance);
      const protoKeys = Object.getOwnPropertyNames(instanceProto);

      protoKeys.forEach(protoKey => result[protoKey] = instanceProto[protoKey]);

      return result;
    }

    /** Compute the description of the given element */
    async getComponent(newElement) {
      const msg = {
        status: {
          success: false,
          message: ''
        },
        categories: []
      };

      if (this.devInspector) {
        if (this.processing) {
          this.queuedElement = newElement;
        } else if (newElement) {
          if (newElement !== this.currentElement) {
            this.stopObserver();
          }

          this.processing = true;
          this.currentElement = newElement;
          this.currentComponentInstance = (await this.devInspector.getInstance(newElement)) || null;

          const currentInstance = this.currentComponentInstance;

          if (currentInstance) {
            const {
              instance,
            } = currentInstance;

            const fullInstance = this.buildFullInstance(instance);

            const parsedKeys = [];

            let {
              props,
              states,
              elements,
              methods,
              events: {
                emmiters,
                listeners
              }
            } = currentInstance.meta;

            props = this.mapValue(props as any, fullInstance, parsedKeys, true);
            states = this.mapValue(states as any, fullInstance, parsedKeys, true, true);
            elements = this.mapValue(elements as any, fullInstance, parsedKeys);
            methods = this.mapValue(methods as any, fullInstance, parsedKeys);
            emmiters = this.mapValue(emmiters as any, fullInstance, parsedKeys);
            listeners = this.mapValue(listeners as any, fullInstance, parsedKeys);

            const lifecycleMethods = this.mapValue([
              { name: 'componentWillLoad' },
              { name: 'componentDidLoad' },
              { name: 'componentDidUnload' },
              { name: 'componentWillUpdate' },
              { name: 'componentDidUpdate' },
              { name: 'render' }
            ] as any, fullInstance, parsedKeys);

            const remainingKeys = this.mapValue(
              Object
                .keys(fullInstance)
                .filter(key => !parsedKeys.includes(key))
                .map(name => ({ name })) as any,
              fullInstance,
              parsedKeys
            );

            msg.status.success = true;
            msg.categories = [
              { label: 'Props', items: props },
              { label: 'States', items: states },
              { label: 'Elements', items: elements },
              { label: 'Methods', items: methods },
              { label: 'Events', items: {
                  emitters: emmiters,
                  listeners
                } },
              { label: 'Lifecycle Methods', items: lifecycleMethods },
              { label: 'Other Items', items: remainingKeys }
            ];
          } else {
            msg.status.message = 'The element is not a Stencil component.';
          }
        } else {
          msg.status.message = 'No element selected.';
        }
      }

      this.postMsg('component', msg);
    }

    /** Update the value of a given prop */
    updateValue(prop: string, value: string | number | boolean, instance = false) {
      if (instance) {
        this.currentComponentInstance.instance[prop] = value;
      } else {
        this.currentElement[prop] = value;
      }
    }
  }

  /**
   * Map the instance to the Window object.
   *
   * This piece of code is quite important since it also forces the instance to be created.
   */
  (window as any).__STENCIL_INSPECTOR__ = Scout.Instance;
})();
